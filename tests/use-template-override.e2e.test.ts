/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import childProcess from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Overriding templates', () => {

  const adr: string = path.resolve(__dirname, '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  afterEach(() => {
    childProcess.execSync('rm -rf .adr-dir doc tmp', { cwd: __dirname });
  });

  beforeEach(() => {
    childProcess.execSync(`${command} init`, { cwd: __dirname });
  });

  it('should use an override template if one exists', () => {
    const directory: string = path.resolve(path.join(__dirname, 'doc/adr'));
    fs.mkdirSync(path.join(directory, 'templates'), { recursive: true });
    fs.writeFileSync(path.join(directory, 'templates', 'template.md'), '# This is an override template\nTITLE\nDATE\nNUMBER\nSTATUS');

    childProcess.execSync(`${command} new Example ADR`, { cwd: __dirname });
    childProcess.execSync(`${command} new Another Example ADR`, { cwd: __dirname });
    const expectedFile: string = path.join(directory, '0002-example-adr.md');
    const expectedFile2: string = path.join(directory, '0003-another-example-adr.md');

    const fileContents = fs.readFileSync(expectedFile, 'utf8');
    const fileContents2 = fs.readFileSync(expectedFile2, 'utf8');
    expect(fileContents).toMatchSnapshot();
    expect(fileContents2).toMatchSnapshot();
  });
});
