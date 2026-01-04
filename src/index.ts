#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs/promises';
import { generateToc, init, link, listAdrs, newAdr } from './lib/adr.js';
import { workingDir } from './lib/config.js';
import { getLinksFrom, getTitleFrom } from './lib/manipulator.js';
import { LIB_VERSION } from './version.js';

const program = new Command();

const collectLinks = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

const collectSupersedes = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

const generateGraph = async (options?: { prefix: string; extension: string }) => {
  let text = 'digraph {\n';
  text += '  node [shape=plaintext];\n';
  text += '  subgraph {\n';

  const adrs = await listAdrs();
  for (let i = 0; i < adrs.length; i++) {
    const n = i + 1;
    const adrPath = adrs[i];
    const contents = await fs.readFile(adrPath, 'utf8');
    const title = getTitleFrom(contents);
    text += `    _${n} [label="${title}"; URL="${options?.prefix || ''}${path.basename(adrPath, '.md')}${options?.extension}"];\n`;
    if (n > 1) {
      text += `    _${n - 1} -> _${n} [style="dotted", weight=1];\n`;
    }
  }
  text += '  }\n';
  for (let i = 0; i < adrs.length; i++) {
    const n = i + 1;
    const adrPath = adrs[i];
    const contents = await fs.readFile(adrPath, 'utf8');
    const linksInADR = getLinksFrom(contents);

    for (let j = 0; j < linksInADR.length; j++) {
      if (!linksInADR[j].label.endsWith('by')) {
        text += `  _${n} -> _${linksInADR[j].targetNumber} [label="${linksInADR[j].label}", weight=0]\n`;
      }
    }
  }

  text += '}\n';
  console.log(text);
};

program.name('adr').version(LIB_VERSION).description('Manage Architecture Decision Logs');

program
  .command('new')
  .argument('<title...>', 'The title of the decision')
  .option(
    '-q, --quiet',
    'Do not ask for clarification. If multiple files match the search pattern, an error will be thrown.'
  )
  .option('--open', 'Open the created ADR after writing it (use OS default or `--open-with`).')
  .option(
    '--open-with <COMMAND>',
    'Open the created ADR with a specific command (optionally with args); implies `--open`.'
  )
  .option(
    '-s, --supersede <SUPERSEDE>',
    'A reference (number or partial filename) of a previous decision that the new decision supercedes.\n' +
      'A Markdown link to the superceded ADR is inserted into the Status section.\n' +
      'The status of the superceded ADR is changed to record that it has been superceded by the new ADR.',
    collectSupersedes,
    []
  )
  .option(
    '-l, --link "<TARGET:LINK:REVERSE-LINK>"',
    'Links the new ADR to a previous ADR.\n' +
      `${chalk.bold('TARGET')} is a reference (number or partial filename) of a previous decision.\n` +
      `${chalk.bold('LINK')} is the description of the link created in the new ADR.\n` +
      `${chalk.bold('REVERSE-LINK')} is the description of the link created in the existing ADR that will refer to the new ADR`,
    collectLinks,
    []
  )
  .action(async (title: string[], options) => {
    try {
      await newAdr(title.join(' '), {
        supersedes: options.supersede,
        date: process.env.ADR_DATE,
        suppressPrompts: options.quiet || false,
        links: options.link,
        open: options.open || Boolean(options.openWith),
        openWith: options.openWith
      });
    } catch (e) {
      program.error(chalk.red((e as Error).message), { exitCode: 1 });
    }
  });

const generate = program.command('generate');

generate
  .command('toc')
  .option('-p, --prefix <PREFIX>', 'The prefix to use for each file link in the generated TOC.')
  .action((options) => generateToc(options));

generate
  .command('graph')
  .option('-p, --prefix <PREFIX>', 'Prefix each decision file link with PREFIX.')
  .option(
    '-e, --extension <EXTENSION>',
    'the file extension of the documents to which generated links refer. Defaults to .html',
    '.html'
  )
  .action(async (options) => {
    await generateGraph(options);
  });

program
  .command('link')
  .argument('<SOURCE>', 'Full or Partial reference number to an ADR')
  .argument('<LINK>', 'The description of the link created in the SOURCE')
  .argument('<TARGET>', 'Full or Partial reference number to an ADR')
  .argument('<REVERSE-LINK>', 'The description of the link created in the TARGET')
  .option(
    '-q, --quiet',
    'Do not ask for clarification. If multiple files match the search pattern, an error will be thrown.'
  )
  .action(link);

program
  .command('init')
  .argument('[directory]', 'Initialize a new ADR directory')
  .action(async (directory?: string) => {
    await init(directory);
  });

program.command('list').action(async () => {
  const adrs = await listAdrs();
  console.log(adrs.map((adr) => path.relative(workingDir(), adr)).join('\n'));
});

program.parse();
