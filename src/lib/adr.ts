import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs/promises';
import { getDir, workingDir } from './config.js';
import { findMatchingFilesFor, getLinkDetails } from './links.js';
import { getTitleFrom, injectLink, supersede } from './manipulator.js';
import { newNumber } from './numbering.js';
import { askForClarification } from './prompt.js';
import { template } from './template.js';

const __filename = fileURLToPath(import.meta.url);

const normalizeEditorCommand = (raw: string | undefined): string | undefined => {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const unquoted = trimmed.replace(/^['"](.+)['"]$/, '$1').trim();
  if (!unquoted) {
    return undefined;
  }

  const lowered = unquoted.toLowerCase();
  if (lowered === 'true' || lowered === 'false') {
    return undefined;
  }

  return unquoted;
};

const unescapeDoubleQuoted = (value: string): string => {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '\\' && i + 1 < value.length) {
      const next = value[i + 1];
      if (next === '\\' || next === '"') {
        result += next;
        i++;
        continue;
      }
    }
    result += ch;
  }
  return result;
};

const splitCommandLine = (commandLine: string): string[] => {
  const tokens = commandLine.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
  if (!tokens) {
    return [];
  }

  return tokens.map((token) => {
    if (token.startsWith('"') && token.endsWith('"')) {
      return unescapeDoubleQuoted(token.slice(1, -1));
    }

    if (token.startsWith("'") && token.endsWith("'")) {
      return token.slice(1, -1);
    }

    return token;
  });
};

type OpenPlan = { type: 'none' } | { type: 'default' } | { type: 'app'; name: string; args: string[] };

const openAdr = async (
  adrPath: string,
  options: { app?: { name: string; arguments: string[] }; wait: false },
  openPromise: Promise<typeof import('open')>
) => {
  const { default: open } = await openPromise;
  await open(adrPath, options);
};

const resolveOpenPlan = (config?: NewOptions): OpenPlan => {
  if (!config || (config.open === undefined && !config.openWith)) {
    return chooseOpenPlan(undefined);
  }

  return chooseOpenPlan({
    ...(config.open !== undefined ? { open: config.open } : {}),
    ...(config.openWith ? { openWith: config.openWith } : {})
  });
};

const shouldLoadOpenLibrary = (openPlan: OpenPlan) => openPlan.type !== 'none';

const openNewAdr = async (openPlan: OpenPlan, adrPath: string, openPromise?: Promise<typeof import('open')>) => {
  if (openPlan.type === 'none') {
    return;
  }

  if (openPlan.type === 'default') {
    await openAdr(adrPath, { wait: false }, openPromise!);
    return;
  }

  await openAdr(adrPath, { app: { name: openPlan.name, arguments: openPlan.args }, wait: false }, openPromise!);
};

const equalsIgnoreCase = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const isNpmInjectedEditor = (editor: string) => {
  const env = process.env as NodeJS.ProcessEnv & {
    npm_config_editor?: string;
    npm_execpath?: string;
  };
  const npmEditor = normalizeEditorCommand(env.npm_config_editor);
  if (!npmEditor) {
    return false;
  }

  if (!equalsIgnoreCase(editor, npmEditor)) {
    return false;
  }

  return Boolean(env.npm_execpath);
};

const toAppPlan = (commandLine: string | undefined): OpenPlan | undefined => {
  const normalized = normalizeEditorCommand(commandLine);
  if (!normalized) {
    return undefined;
  }

  const [name, ...args] = splitCommandLine(normalized);
  if (!name) {
    return undefined;
  }

  return { type: 'app', name, args };
};

export const chooseOpenPlan = (options?: { open?: boolean; openWith?: string }): OpenPlan => {
  const openWithPlan = toAppPlan(options?.openWith);
  const shouldOpen = Boolean(options?.open) || Boolean(openWithPlan);
  if (!shouldOpen) {
    return { type: 'none' };
  }

  if (openWithPlan) {
    return openWithPlan;
  }

  const visualPlan = toAppPlan(process.env.VISUAL);
  if (visualPlan) {
    return visualPlan;
  }

  const editorCommand = normalizeEditorCommand(process.env.EDITOR);
  if (editorCommand && !isNpmInjectedEditor(editorCommand)) {
    const editorPlan = toAppPlan(editorCommand);
    if (editorPlan) {
      return editorPlan;
    }
  }

  return { type: 'default' };
};

interface NewOptions {
  supersedes?: string[];
  date?: string | undefined;
  suppressPrompts?: boolean;
  template?: string;
  links?: string[];
  open?: boolean;
  openWith?: string;
}

// eslint-disable-next-line no-unused-vars
enum LinkType {
  // eslint-disable-next-line no-unused-vars
  LINK = 'link',
  // eslint-disable-next-line no-unused-vars
  SUPERSEDE = 'supersede'
}

interface LinkTask {
  type: LinkType;
  sourcePath: string;
  targetPath: string;
  link: string;
  reverseLink: string;
}

const actuallyLink = async (task: LinkTask) => {
  const linkedFile = path.join(await getDir(), task.targetPath);
  const newAdrContent = await fs.readFile(task.sourcePath, 'utf8');
  const oldAdrContent = await fs.readFile(linkedFile, 'utf8');
  const oldTitle = getTitleFrom(oldAdrContent);
  const newTitle = getTitleFrom(newAdrContent);
  let dirtyOld = '',
    dirtyNew = '';
  switch (task.type) {
    case LinkType.LINK:
      dirtyOld = injectLink(
        oldAdrContent,
        `${task.reverseLink} [${newTitle}](${path.relative(await getDir(), task.sourcePath)})`
      );
      dirtyNew = injectLink(newAdrContent, `${task.link} [${oldTitle}](${task.targetPath})`);
      break;
    case LinkType.SUPERSEDE:
      dirtyOld = supersede(
        oldAdrContent,
        `${task.reverseLink} [${newTitle}](${path.relative(await getDir(), task.sourcePath)})`
      );
      dirtyNew = injectLink(newAdrContent, `${task.link} [${oldTitle}](${task.targetPath})`);
      break;
  }

  await fs.writeFile(linkedFile, dirtyOld);
  await fs.writeFile(task.sourcePath, dirtyNew);
};

const processSupersedes = async (sourcePath: string, supersedes: string[] = [], suppressPrompts: boolean = false) => {
  if (supersedes.length === 0) {
    return;
  }

  const supersedeStrings = await Promise.all(supersedes.map((link) => getLinkDetails(link, true)));

  for (const targetDetails of supersedeStrings) {
    const task: LinkTask = {
      type: LinkType.SUPERSEDE,
      sourcePath: sourcePath,
      link: targetDetails.link,
      reverseLink: targetDetails.reverseLink,
      targetPath: targetDetails.matches[0]
    };

    if (targetDetails.matches.length > 1) {
      if (suppressPrompts) {
        throw new Error(
          `Multiple files match the search pattern for "${targetDetails.original}".\n` +
            'Please specify which file you want to targetDetails to more or remove the -q or --quiet options from the command line.'
        );
      }
      task.targetPath = await askForClarification(targetDetails.original, targetDetails.matches);
    }

    await actuallyLink(task);
  }
};

const injectLinksTo = async (sourcePath: string, links: string[] = [], suppressPrompts: boolean = false) => {
  if (links.length === 0) {
    return;
  }

  const linkStrings = await Promise.all(links.map((link) => getLinkDetails(link)));

  for (const targetDetails of linkStrings) {
    const task: LinkTask = {
      type: LinkType.LINK,
      sourcePath: sourcePath,
      link: targetDetails.link,
      reverseLink: targetDetails.reverseLink,
      targetPath: targetDetails.matches[0]
    };

    if (targetDetails.matches.length > 1) {
      if (suppressPrompts) {
        throw new Error(
          `Multiple files match the search pattern for "${targetDetails.original}".\n` +
            'Please specify which file you want to targetDetails to more or remove the -q or --quiet options from the command line.'
        );
      }
      task.targetPath = await askForClarification(targetDetails.original, targetDetails.matches);
    }

    await actuallyLink(task);
  }
};
//Generate a table of contents for the adr directory
export const generateToc = async (options?: { prefix?: string }) => {
  const adrDir = await getDir();
  const files = await fs.readdir(adrDir);
  const toc = files.filter((file) => file.match(/^\d{4,}-.*\.md$/)).sort();

  const titles = toc.map(async (file) => {
    const title = getTitleFrom(await fs.readFile(path.join(adrDir, file), 'utf8'));
    return `- [${title}](${options?.prefix || ''}${file})`;
  });

  const resolvedTitles = await Promise.all(titles);

  const tocFile = path.resolve(path.join(adrDir, 'decisions.md'));
  await fs.writeFile(tocFile, `# Table of Contents\n\n${resolvedTitles.join('\n')}`);
};

export const newAdr = async (title: string, config?: NewOptions) => {
  const openPlan = resolveOpenPlan(config);
  const openPromise = shouldLoadOpenLibrary(openPlan) ? import('open') : undefined;

  const newNum = await newNumber();
  const formattedDate = config?.date || new Date().toISOString().split('T')[0] || 'ERROR';
  const tpl = await template(config?.template);
  const adr = tpl
    .replace('DATE', formattedDate)
    .replace('TITLE', title)
    .replace('NUMBER', newNum.toString())
    .replace('STATUS', 'Accepted');
  const paddedNumber = newNum.toString().padStart(4, '0');
  const cleansedTitle = title
    .toLowerCase()
    .replace(/\W/g, '-')
    .replace(/^(.*)\W$/, '$1')
    .replace(/^\W(.*)$/, '$1');
  const fileName = `${paddedNumber}-${cleansedTitle}.md`;
  const adrDirectory = await getDir();
  const adrPath = path.resolve(path.join(adrDirectory, fileName));
  await fs.writeFile(adrPath, adr);
  await fs.writeFile(path.resolve(adrDirectory, '.adr-sequence.lock'), newNum.toString());

  await processSupersedes(adrPath, config?.supersedes, config?.suppressPrompts);
  await injectLinksTo(adrPath, config?.links, config?.suppressPrompts);
  await generateToc();

  await openNewAdr(openPlan, adrPath, openPromise);
};

export const init = async (directory?: string) => {
  const dir = directory || (await getDir());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(workingDir(), '.adr-dir'), path.relative(workingDir(), dir));
  await newAdr('Record Architecture Decisions', {
    date: process.env.ADR_DATE,
    template: path.resolve(path.dirname(__filename), '../templates/init.md')
  });
};

export const link = async (
  source: string,
  link: string,
  target: string,
  reverseLink: string,
  options?: { quiet?: boolean }
) => {
  const getFor = async (pattern: string) => {
    const found = await findMatchingFilesFor(pattern);
    if (found.length === 1) {
      return found[0];
    }

    if (options?.quiet) {
      throw new Error(
        `Multiple files match the search pattern for "${pattern}".\n` +
          'Please specify which file you want to targetDetails to more or remove the -q or --quiet options from the command line.'
      );
    }

    return askForClarification(pattern, found);
  };

  const sourceFile = await getFor(source);

  await injectLinksTo(path.resolve(await getDir(), sourceFile), [`${target}:${link}:${reverseLink}`]);
};

export const listAdrs = async () => {
  const dir = await getDir();
  const files = await fs.readdir(dir);
  const toc = files
    .map((f) => {
      const adrFile = f.match(/^0*(\d+)-.*$/);
      if (!adrFile) {
        return null;
      }
      return {
        number: Number.parseInt(adrFile[1], 10),
        path: path.resolve(dir, adrFile[0])
      };
    })
    .filter((entry): entry is { number: number; path: string } => Boolean(entry))
    .sort((a, b) => a.number - b.number)
    .map((entry) => entry.path);
  return toc;
};
