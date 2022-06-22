#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import fs from 'fs/promises';

const cwd: string = process.cwd();

const getDir = async (): Promise<string> => {
  try {
    const configFile = await fs.readFile(path.join(cwd, '.adr-dir'), 'utf8');
    return path.resolve(configFile.trim());
  } catch (e) {
    return path.resolve(path.join(cwd, 'doc/adr'));
  }
};

const template = async (templateFile?: string): Promise<string> => {
  if (templateFile) {
    return fs.readFile(path.resolve(templateFile), 'utf8');
  }
  if (process.env.ADR_TEMPLATE) {
    return fs.readFile(path.resolve(process.env.ADR_TEMPLATE), 'utf8');
  }
  return fs.readFile(path.resolve(path.join(__dirname, 'template.md')), 'utf8');
};

const newNumber = async () => {
  const filePattern = /^0*(\d+)-.*$/;
  const files = await fs.readdir(await getDir());
  const numbers = files.map(f => {
    const adrFile = f.match(filePattern);
    if (adrFile) {
      return parseInt(adrFile[1], 10);
    }
    return 0;
  });

  const largestNumber = numbers.reduce((a, b) => Math.max(a, b), 0);
  return largestNumber + 1;
};

const newAdr = async (title: string, templateFile?: string) => {
  const newNum = await newNumber();
  const formattedDate = new Date().toISOString().split('T')[0] || 'ERROR';
  const tpl = await template(templateFile);
  const finalDoc = tpl.replace('DATE', formattedDate).replace('TITLE', title).replace('NUMBER', newNum.toString()).replace('STATUS', 'Accepted');
  const paddedNumber = newNum.toString().padStart(4, '0');
  const fileName = `${paddedNumber}-${title.toLowerCase().replace(/\s/g, '-')}.md`;
  await fs.writeFile(path.resolve(path.join(await getDir(), fileName)), finalDoc);
};

program.command('new').argument('<title...>', 'The title of the decision').action(async (title: string[]) => {
  await newAdr(title.join(' '));
});

program.command('init').argument('[directory]', 'The directory to store decision records in').action(async (directory?: string) => {
  const dir = directory || await getDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(cwd, '.adr-dir'), path.relative(cwd, dir));
  await newAdr('Record Architecture Decisions', path.resolve(path.dirname(__filename), 'init.md'));
});

program.parse();
