import fs from 'fs/promises';
import childProcess from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDir, workingDir } from './config.js';
import { findMatchingFilesFor, injectLinksTo, processSupersedes } from './links.js';
import { AdrListItem, getAllADRs } from './list.js';
import { newNumber } from './numbering.js';
import { askForClarification } from './prompt.js';
import { template } from './template.js';

const __filename = fileURLToPath(import.meta.url);

interface NewOptions {
  supersedes?: string[];
  date?: string | undefined;
  suppressPrompts?: boolean;
  template?: string;
  links?: string[];
}

export const generateToc = async (options?: {prefix?: string}) => {

  const adrs: AdrListItem[] = await getAllADRs();
  const resolvedTitles = adrs.map((adr) => `- [${adr.title}](${options?.prefix || ''}${adr.file})`);

  const tocFile = path.resolve(path.join(await getDir(), 'decisions.md'));
  await fs.writeFile(tocFile, `# Table of Contents\n\n${resolvedTitles.join('\n')}`);
};

export const listADRs = async () => {
  const ADRs: AdrListItem[] = await getAllADRs();
  return ADRs.map(adr => adr.path);
};

export const newAdr = async (title: string, config?: NewOptions) => {
  const newNum = await newNumber();
  const formattedDate = config?.date || new Date().toISOString().split('T')[0] || 'ERROR';
  const tpl = await template(config?.template);
  const adr = tpl.replace('DATE', formattedDate).replace('TITLE', title).replace('NUMBER', newNum.toString()).replace('STATUS', 'Accepted');
  const paddedNumber = newNum.toString().padStart(4, '0');
  const cleansedTitle = title.toLowerCase().replace(/\W/g, '-').replace(/^(.*)\W$/, '$1').replace(/^\W(.*)$/, '$1');
  const fileName = `${paddedNumber}-${cleansedTitle}.md`;
  const adrDirectory = await getDir();
  const adrPath = path.resolve(path.join(adrDirectory, fileName));
  await fs.writeFile(adrPath, adr);
  await fs.writeFile(path.resolve(adrDirectory, '.adr-sequence.lock'), newNum.toString());

  await processSupersedes(
    adrPath,
    config?.supersedes,
    config?.suppressPrompts
  );
  await injectLinksTo(
    adrPath,
    config?.links,
    config?.suppressPrompts
  );
  await generateToc();
  const newAdrPath = path.relative(workingDir(), adrPath);

  if (process.env.VISUAL) {
    await childProcess.spawn(process.env.VISUAL, [adrPath], {
      stdio: 'inherit',
      shell: true
    });
    return;
  }
  if (process.env.EDITOR) {
    await childProcess.spawn(process.env.EDITOR, [adrPath], {
      stdio: 'inherit',
      shell: true
    });
    return;
  }
  console.log(newAdrPath);

};

export const init = async (directory?: string) => {
  const dir = directory || await getDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(workingDir(), '.adr-dir'), path.relative(workingDir(), dir));
  await newAdr('Record Architecture Decisions', {
    date: process.env.ADR_DATE,
    template: path.resolve(path.dirname(__filename), '../templates/init.md')
  });
};

export const link = async (source: string, link: string, target: string, reverseLink: string, options?: {quiet?: boolean}) => {
  const getFor = async (pattern: string) => {
    const found = await findMatchingFilesFor(pattern);
    if (found.length === 1) {
      return found[0];
    }

    if (options?.quiet) {
      throw new Error(`Multiple files match the search pattern for "${pattern}".\n`
        + 'Please specify which file you want to targetDetails to more or remove the -q or --quiet options from the command line.');
    }

    return askForClarification(pattern, found);
  };

  const sourceFile = await getFor(source);

  await injectLinksTo(path.resolve(await getDir(), sourceFile), [`${target}:${link}:${reverseLink}`]);

};

