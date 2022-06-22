/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Init an ADR Repository', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
    childProcess.execSync(`${command} init ${adrDirectory}`, { cwd: workDir });
  });

  afterEach(() => {
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should use the default directory', () => {
    childProcess.execSync(`${command} init`, { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0001-record-architecture-decisions.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });

  it('should use an alternate directory', () => {
    const directory: string = path.resolve(path.join(workDir, 'tmp', 'alternative-dir'));
    childProcess.execSync(`${command} init ${directory}`, { cwd: workDir });
    childProcess.execSync(`${command} new Example ADR`, { cwd: workDir });

    const expectedInitFile: string = path.join(directory, '0001-record-architecture-decisions.md');
    expect(fs.existsSync(expectedInitFile)).toBeTruthy();

    const expectedNewFile: string = path.join(directory, '0002-example-adr.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });
});
