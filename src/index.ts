#!/usr/bin/env node

import fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import { generateToc, init, link, listAdrs, newAdr } from './lib/adr.js';
import { workingDir } from './lib/config.js';
import { getLinksFrom, getTitleFrom } from './lib/manipulator.js';
import { LIB_VERSION } from './version.js';

const collectLinks = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

const collectSupersedes = (val: string, memo: string[]) => {
  memo.push(val);
  return memo;
};

type ProgramDeps = {
  generateToc: typeof generateToc;
  init: typeof init;
  link: typeof link;
  listAdrs: typeof listAdrs;
  newAdr: typeof newAdr;
  workingDir: typeof workingDir;
  readFile: typeof fs.readFile;
  getLinksFrom: typeof getLinksFrom;
  getTitleFrom: typeof getTitleFrom;
  version: string;
  onError: (program: Command, error: Error) => void;
  log: (message: string) => void;
  warn: (message: string) => void;
};

export const defaultOnError = (program: Command, error: Error) => {
  program.error(chalk.red(error.message), { exitCode: 1 });
};

const defaultDeps: ProgramDeps = {
  generateToc,
  init,
  link,
  listAdrs,
  newAdr,
  workingDir,
  readFile: fs.readFile,
  getLinksFrom,
  getTitleFrom,
  version: LIB_VERSION,
  onError: defaultOnError,
  log: console.log,
  warn: console.warn
};

const escapeDotString = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n|\n|\r/g, '\\\\n');

const getAdrNumberFromPath = (adrPath: string): number | undefined => {
  const baseName = path.basename(adrPath, '.md');
  const match = baseName.match(/^0*(\d+)-/);
  if (!match) {
    return undefined;
  }
  return Number.parseInt(match[1], 10);
};

type GraphNode = { adrPath: string; number: number };

const resolveGraphNodes = (adrs: string[]): GraphNode[] =>
  adrs
    .map((adrPath) => ({ adrPath, number: getAdrNumberFromPath(adrPath) }))
    .filter((node): node is GraphNode => node.number !== undefined);

const appendGraphNodes = async (
  deps: ProgramDeps,
  nodes: GraphNode[],
  options: { prefix?: string; extension?: string } | undefined,
  lines: string[]
) => {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i].number;
    const adrPath = nodes[i].adrPath;
    const contents = await deps.readFile(adrPath, 'utf8');
    const title = deps.getTitleFrom(contents);
    const url = `${options?.prefix || ''}${path.basename(adrPath, '.md')}${options?.extension}`;
    lines.push(`    _${n} [label="${escapeDotString(title)}"; URL="${escapeDotString(url)}"];`);
    const previous = nodes[i - 1]?.number;
    if (previous !== undefined) {
      lines.push(`    _${previous} -> _${n} [style="dotted", weight=1];`);
    }
  }
};

const resolveTargetNodeId = (nodeIds: Set<number>, targetNumber: string): number | undefined => {
  const number = Number.parseInt(targetNumber, 10);
  if (!Number.isFinite(number) || !nodeIds.has(number)) {
    return undefined;
  }
  return number;
};

const appendGraphEdges = async (deps: ProgramDeps, nodes: GraphNode[], lines: string[]) => {
  const nodeIds = new Set(nodes.map((node) => node.number));
  for (const node of nodes) {
    const contents = await deps.readFile(node.adrPath, 'utf8');
    const linksInADR = deps.getLinksFrom(contents);
    for (const link of linksInADR) {
      if (link.label.endsWith('by')) {
        continue;
      }
      const target = resolveTargetNodeId(nodeIds, link.targetNumber);
      if (target !== undefined) {
        lines.push(`  _${node.number} -> _${target} [label="${link.label}", weight=0]`);
      } else {
        deps.warn(`Skipping graph link from ADR ${node.number} to missing ADR ${link.targetNumber}: ${link.label}`);
      }
    }
  }
};

const generateGraph = async (deps: ProgramDeps, options?: { prefix: string; extension: string }) => {
  const lines: string[] = [];
  lines.push('digraph {');
  lines.push('  node [shape=plaintext];');
  lines.push('  subgraph {');

  const adrs = await deps.listAdrs();
  const nodes = resolveGraphNodes(adrs);
  await appendGraphNodes(deps, nodes, options, lines);

  lines.push('  }');
  await appendGraphEdges(deps, nodes, lines);
  lines.push('}');

  deps.log(`${lines.join('\n')}\n`);
};

export const buildProgram = (deps: ProgramDeps = defaultDeps) => {
  const program = new Command();
  program.name('adr').version(deps.version).description('Manage Architecture Decision Logs');

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
        await deps.newAdr(title.join(' '), {
          supersedes: options.supersede,
          date: process.env.ADR_DATE,
          suppressPrompts: options.quiet || false,
          links: options.link,
          open: options.open || Boolean(options.openWith),
          openWith: options.openWith
        });
      } catch (e) {
        deps.onError(program, e as Error);
      }
    });

  const generate = program.command('generate');

  generate
    .command('toc')
    .option('-p, --prefix <PREFIX>', 'The prefix to use for each file link in the generated TOC.')
    .action((options) => deps.generateToc(options));

  generate
    .command('graph')
    .option('-p, --prefix <PREFIX>', 'Prefix each decision file link with PREFIX.')
    .option(
      '-e, --extension <EXTENSION>',
      'the file extension of the documents to which generated links refer. Defaults to .html',
      '.html'
    )
    .action(async (options) => {
      await generateGraph(deps, options);
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
    .action(deps.link);

  program
    .command('init')
    .argument('[directory]', 'Initialize a new ADR directory')
    .action(async (directory?: string) => {
      await deps.init(directory);
    });

  program.command('list').action(async () => {
    const adrs = await deps.listAdrs();
    deps.log(adrs.map((adr) => path.relative(deps.workingDir(), adr)).join('\n'));
  });

  return program;
};

export const run = async (argv = process.argv, deps: ProgramDeps = defaultDeps) => {
  const program = buildProgram(deps);
  await program.parseAsync(argv);
  return program;
};

export const isDirectRun = (argv = process.argv, moduleUrl = import.meta.url) => {
  if (!argv[1]) {
    return false;
  }
  return path.resolve(argv[1]) === fileURLToPath(moduleUrl);
};

export const maybeRun = (argv = process.argv, deps?: ProgramDeps) => {
  if (!isDirectRun(argv)) {
    return false;
  }
  const runPromise = run(argv, deps);
  runPromise.catch(() => undefined);
  return true;
};

maybeRun();
