import fs from 'fs/promises';
import path from 'node:path';
import { getDir } from './config.js';
import { getTitleFrom, injectLink, supersede } from './manipulator.js';
import { askForClarification } from './prompt.js';

export enum LinkType {
  // eslint-disable-next-line no-unused-vars
  LINK = 'link',
  // eslint-disable-next-line no-unused-vars
  SUPERSEDE = 'supersede'
}

export interface LinkDetails {
  pattern: string;
  original: string;
  link: string;
  reverseLink: string;
  matches: string[];
}

export interface LinkTask {
  type: LinkType;
  sourcePath: string;
  targetPath: string;
  link: string;
  reverseLink: string;
}

export const findMatchingFilesFor = async (pattern: string) => {
  const files = await fs.readdir(await getDir());
  return files.filter(file => file.includes(pattern));
};

export const getLinkDetails = async (linkString: string, isSupersede: boolean = false): Promise<LinkDetails> => {
  const parts = linkString.split(':');
  const pattern = parts[0];
  let link = 'Supersedes';
  let reverseLink = 'Superseded by';
  if (!isSupersede) {
    link = parts[1];
    reverseLink = parts[2];
  }
  const files = await findMatchingFilesFor(pattern);
  return {
    pattern: pattern,
    original: linkString,
    link: link,
    reverseLink: reverseLink,
    matches: files
  };
};

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

export const processSupersedes = async (
  sourcePath: string,
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
      sourcePath: sourcePath,
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

export const injectLinksTo = async (
  sourcePath: string,
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
      sourcePath: sourcePath,
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
