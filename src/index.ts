#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { init, listAdrs, newAdr } from './lib/adr';

const program = new Command();

const collect = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

program.name('adr').version(version).description('Manage Architecture Decision Logs');

program.command('new')
  .argument('<title...>', 'The title of the decision')
  .option('-l, --link <TARGET:LINK:REVERSE-LINK>', 'Links the new ADR to a previous ADR.\n'
    + '                                     TARGET is a reference (number or partial filename) of a previous decision.\n'
    + '                                     LINK is the description of the link created in the new ADR.\n'
    + '                                     REVERSE-LINK is the description of the link created in the', collect, [])
  .action(async (title: string[], options) => {
    await newAdr(title.join(' '), { links: options.link });
  });

program.command('init').argument('[directory]', 'Initialize a new ADR directory').action(async (directory?: string) => {
  await init(directory);
});

program.command('list').action(async () => {
  const adrs = await listAdrs();
  console.log(adrs.join('\n').trim());
});

program.parse();
