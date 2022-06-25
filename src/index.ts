#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { generateToc, init, link, listAdrs, newAdr } from './lib/adr';
import chalk from 'chalk';
import { workingDir } from './lib/config';
import * as path from 'path';

const program = new Command();

const collectLinks = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

const collectSupersedes = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

program.name('adr').version(version).description('Manage Architecture Decision Logs');

program.command('new')
  .argument('<title...>', 'The title of the decision')
  .option('-q, --quiet', 'Do not ask for clarification. If multiple files match the search pattern, an error will be thrown.')
  .option('-s, --supersede <SUPERSEDE>', 'A reference (number or partial filename) of a previous decision that the new decision supercedes.\n'
    + 'A Markdown link to the superceded ADR is inserted into the Status section.\n'
    + 'The status of the superceded ADR is changed to record that it has been superceded by the new ADR.', collectSupersedes, [])
  .option('-l, --link "<TARGET:LINK:REVERSE-LINK>"', 'Links the new ADR to a previous ADR.\n'
    + `${chalk.bold('TARGET')} is a reference (number or partial filename) of a previous decision.\n`
    + `${chalk.bold('LINK')} is the description of the link created in the new ADR.\n`
    + `${chalk.bold('REVERSE-LINK')} is the description of the link created in the existing ADR that will refer to the new ADR`, collectLinks, [])
  .action(async (title: string[], options) => {
    try {
      await newAdr(title.join(' '), {
        supersedes: options.supersede,
        date: process.env.ADR_DATE,
        suppressPrompts: options.quiet || false,
        links: options.link
      });
    } catch (e) {
      program.error(chalk.red((e as Error).message), { exitCode: 1 });
    }
  });

program.command('generate')
  .argument('toc')
  .option('-p, --prefix <PREFIX>', 'The prefix to use for each file link in the generated TOC.')
  .action((_command, options) => generateToc(options));

program.command('link')
  .argument('<SOURCE>', 'Full or Partial reference number to an ADR')
  .argument('<LINK>', 'The description of the link created in the SOURCE')
  .argument('<TARGET>', 'Full or Partial reference number to an ADR')
  .argument('<REVERSE-LINK>', 'The description of the link created in the TARGET')
  .option('-q, --quiet', 'Do not ask for clarification. If multiple files match the search pattern, an error will be thrown.')
  .action(link);

program.command('init').argument('[directory]', 'Initialize a new ADR directory').action(async (directory?: string) => {
  await init(directory);
});

program.command('list').action(async () => {
  const adrs = await listAdrs();
  console.log(adrs.map(adr => path.relative(workingDir(), adr)).join('\n'));
});

program.parse();

