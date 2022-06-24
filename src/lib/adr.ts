import { newNumber } from './numbering';
import { template } from './template';
import fs from 'fs/promises';
import path from 'path';
import { getDir, workingDir } from './config';
import { prompt } from 'inquirer';
import chalk from 'chalk';
import { getDetailsFrom, injectLink } from './manipulator';

interface NewOptions {
  date?: string | undefined;
  suppressPrompts?: boolean;
  template?: string;
  links?: string[];
}

const askForClarification = async (link: { original: string, matches: any; link: any; reverseLink: any; }) => {
  const selection = await prompt([
    {
      type: 'list',
      name: 'target',
      message: `Which file do you want to link to for ${chalk.blue(link.original)}?`,
      choices: link.matches
    }
  ]);
  return {
    link: link.link,
    reverseLink: link.reverseLink,
    file: selection.target
  };
};

interface AdrDetails {
  adr: string;
  path: string;
}

const injectLinksTo = async (newAdr: AdrDetails, links: string[] = [], suppressPrompts: boolean = false) => {
  if (links.length === 0) {
    return;
  }

  const processLink = async (linkString: string) => {
    const [target, link, reverseLink] = linkString.split(':');
    const files = (await fs.readdir(await getDir())).filter(file => file.includes(target));
    return {
      original: linkString,
      newAdr: newAdr,
      link: link,
      reverseLink: reverseLink,
      matches: files
    };
  };

  const linkItems = await Promise.all(links.map(processLink));

  const actuallyLink = async (newAdr: AdrDetails, toLink: { file: string, reverseLink: string, link: string }) => {
    const linkedFile = path.join(await getDir(), toLink.file);
    const newAdrContent = await fs.readFile(newAdr.path, 'utf8');
    const oldAdrContent = await fs.readFile(linkedFile, 'utf8');
    const oldTitle = getDetailsFrom(oldAdrContent);
    const newTitle = getDetailsFrom(newAdrContent);

    const dirtyOld = injectLink(oldAdrContent, `${toLink.reverseLink} [${newTitle}](${path.relative(await getDir(), newAdr.path)})`);
    await fs.writeFile(linkedFile, dirtyOld);

    const dirtyNew = injectLink(newAdrContent, `${toLink.link} [${oldTitle}](${toLink.file})`);
    await fs.writeFile(newAdr.path, dirtyNew);
  };

  for (const link of linkItems) {
    let toLink = {
      link: link.link,
      reverseLink: link.reverseLink,
      file: link.matches[0]
    };

    if (!suppressPrompts && link.matches.length > 1) {
      toLink = await askForClarification(link);
    }
    await actuallyLink(newAdr, toLink);
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

  await injectLinksTo({
    adr: adr,
    path: adrPath
  }, config?.links, config?.suppressPrompts);

  // await generateToc();
};

export const init = async (directory?: string) => {
  const dir = directory || await getDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(workingDir(), '.adr-dir'), path.relative(workingDir(), dir));
  await newAdr('Record Architecture Decisions', { template: path.resolve(path.dirname(__filename), '../templates/init.md') });
};

export const listAdrs = async () => {
  const dir = await getDir();
  const files = await fs.readdir(dir);
  const toc = files.map(f => {
    const adrFile = f.match(/^0*(\d+)-.*$/);
    if (adrFile) {
      return adrFile[0];
    }
    return '';
  }).filter(f => f !== '');
  return toc;
};
