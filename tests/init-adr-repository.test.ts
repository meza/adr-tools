/* eslint-disable no-sync */
import { describe, it, expect, afterEach } from 'vitest';
import childProcess from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Init an ADR Repository', () => {
  afterEach(() => {
    childProcess.execSync('rm -rf .adr-dir doc tmp', { cwd: __dirname });
  });

  const adr: string = path.resolve(__dirname, '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  it('should use an alternate directory', () => {
    const directory: string = path.resolve(path.join(__dirname, 'doc/adr'));
    childProcess.execSync(`${command} init`, { cwd: __dirname });
    const expectedFile: string = path.join(directory, '0001-record-architecture-decisions.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });

  it('should use an alternate directory', () => {
    const directory: string = path.resolve(path.join(__dirname, 'tmp', 'alternative-dir'));
    childProcess.execSync(`${command} init ${directory}`, { cwd: __dirname });
    childProcess.execSync(`${command} new Example ADR`, { cwd: __dirname });

    const expectedInitFile: string = path.join(directory, '0001-record-architecture-decisions.md');
    expect(fs.existsSync(expectedInitFile)).toBeTruthy();

    const expectedNewFile: string = path.join(directory, '0002-example-adr.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });
});
