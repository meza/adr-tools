import { newNumber } from './numbering';
import { template } from './template';
import fs from 'fs/promises';
import path from 'path';
import { getDir, workingDir } from './config';

export const newAdr = async (title: string, templateFile?: string) => {
  const newNum = await newNumber();
  const formattedDate = new Date().toISOString().split('T')[0] || 'ERROR';
  const tpl = await template(templateFile);
  const finalDoc = tpl.replace('DATE', formattedDate).replace('TITLE', title).replace('NUMBER', newNum.toString()).replace('STATUS', 'Accepted');
  const paddedNumber = newNum.toString().padStart(4, '0');
  const cleansedTitle = title.toLowerCase().replace(/\W/g, '-').replace(/^(.*)\W$/, '$1').replace(/^\W(.*)$/, '$1');
  const fileName = `${paddedNumber}-${cleansedTitle}.md`;
  await fs.writeFile(path.resolve(path.join(await getDir(), fileName)), finalDoc);
  // await generateToc();
};

export const init = async (directory?: string) => {
  const dir = directory || await getDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(workingDir(), '.adr-dir'), path.relative(workingDir(), dir));
  await newAdr('Record Architecture Decisions', path.resolve(path.dirname(__filename), '../templates/init.md'));
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
