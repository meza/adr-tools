/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('New Adrs', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
  });

  afterEach(() => {
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should create a new one normally', () => {
    childProcess.execSync(`${command} init ${adrDirectory}`, { cwd: workDir });
    childProcess.execSync(`${command} new Example ADR`, { cwd: workDir });

    const expectedNewFile: string = path.join(adrDirectory, '0002-example-adr.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });

  it('should create a new one even if no config exists', () => {
    childProcess.execSync(`${command} new Example ADR`, { cwd: workDir });

    const expectedNewFile: string = path.join(adrDirectory, '0001-example-adr.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });
});
