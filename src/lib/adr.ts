import { newNumber } from './numbering';
import { template } from './template';
import fs from 'fs/promises';
import path from 'path';
import { getDir, workingDir } from './config';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import { getTitleFrom, injectLink, supersede } from './manipulator';
import { getLinkDetails } from './links';
import childProcess from 'node:child_process';

interface NewOptions {
  supersedes?: string[];
  date?: string | undefined;
  suppressPrompts?: boolean;
  template?: string;
  links?: string[];
}

interface AdrDetails {
  adr: string;
  path: string;
}

const askForClarification = async (searchString: string, matches: string[]) => {
  const selection = await prompt([
    {
      type: 'list',
      name: 'target',
      message: `Which file do you want to link to for ${chalk.blue(searchString)}?`,
      choices: matches
    }
  ]);
  return selection.target;
};

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
  let dirtyOld = '', dirtyNew = '';
  switch (task.type) {
    case LinkType.LINK:
      dirtyOld = injectLink(oldAdrContent, `${task.reverseLink} [${newTitle}](${path.relative(await getDir(), task.sourcePath)})`);
      dirtyNew = injectLink(newAdrContent, `${task.link} [${oldTitle}](${task.targetPath})`);
      break;
    case LinkType.SUPERSEDE:
      dirtyOld = supersede(oldAdrContent, `${task.reverseLink} [${newTitle}](${path.relative(await getDir(), task.sourcePath)})`);
      dirtyNew = injectLink(newAdrContent, `${task.link} [${oldTitle}](${task.targetPath})`);
      break;
    default:
      break;
  }

  await fs.writeFile(linkedFile, dirtyOld);
  await fs.writeFile(task.sourcePath, dirtyNew);
};

const processSupersedes = async (
  source: AdrDetails,
  supersedes: string[] = [],
  suppressPrompts: boolean = false
) => {
  if (supersedes.length === 0) {
    return;
  }

  const supersedeStrings = await Promise.all(supersedes.map((link) => getLinkDetails(link, true)));

  for (const targetDetails of supersedeStrings) {
    const task: LinkTask = {
      type: LinkType.SUPERSEDE,
      sourcePath: source.path,
      link: targetDetails.link,
      reverseLink: targetDetails.reverseLink,
      targetPath: targetDetails.matches[0]
    };

    if (targetDetails.matches.length > 1) {
      if (suppressPrompts) {
        throw new Error(`Multiple files match the search pattern for "${targetDetails.original}".\n`
          + 'Please specify which file you want to targetDetails to more or remove the -q or --quiet options from the command line.');
      } else {
        task.targetPath = await askForClarification(targetDetails.original, targetDetails.matches);
      }
    }

    await actuallyLink(task);
  }
};

const injectLinksTo = async (
  source: AdrDetails,
  links: string[] = [],
  suppressPrompts: boolean = false
) => {
  if (links.length === 0) {
    return;
  }

  const linkStrings = await Promise.all(links.map((link) => getLinkDetails(link)));

  for (const targetDetails of linkStrings) {
    const task: LinkTask = {
      type: LinkType.LINK,
      sourcePath: source.path,
      link: targetDetails.link,
      reverseLink: targetDetails.reverseLink,
      targetPath: targetDetails.matches[0]
    };

    if (targetDetails.matches.length > 1) {
      if (suppressPrompts) {
        throw new Error(`Multiple files match the search pattern for "${targetDetails.original}".\n`
          + 'Please specify which file you want to targetDetails to more or remove the -q or --quiet options from the command line.');
      } else {
        task.targetPath = await askForClarification(targetDetails.original, targetDetails.matches);
      }
    }

    await actuallyLink(task);
  }

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

  await processSupersedes(
    {
      adr: adr,
      path: adrPath
    },
    config?.supersedes,
    config?.suppressPrompts
  );
  await injectLinksTo(
    {
      adr: adr,
      path: adrPath
    },
    config?.links,
    config?.suppressPrompts
  );
  // await generateToc();
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

export const listAdrs = async () => {
  const dir = await getDir();
  const files = await fs.readdir(dir);
  const toc = files.map(f => {
    const adrFile = f.match(/^0*(\d+)-.*$/);
    if (adrFile) {
      return path.resolve(dir, adrFile[0]);
    }
    return '';
  }).filter(f => f !== '');
  return toc;
};
