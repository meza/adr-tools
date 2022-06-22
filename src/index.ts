#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { init, newAdr } from './lib/adr';

const program = new Command();

program.name('adr').version(version).description('Manage Architecture Decision Logs');

program.command('new').argument('<title...>', 'The title of the decision').action(async (title: string[]) => {
  await newAdr(title.join(' '));
});

program.command('init').argument('[directory]', 'Initialize a new ADR directory').action(async (directory?: string) => {
  await init(directory);
});

program.parse();
