/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('deep directories', () => {

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

  it('can work', () => {
    const innerPath = path.join(fs.mkdtempSync(path.resolve(workDir) + '/'), 'inner');
    fs.mkdirSync(innerPath, { recursive: true });
    childProcess.execSync(`${command} new this should exist`, { cwd: innerPath });
    const expectedFile: string = path.join(adrDirectory, '0002-this-should-exist.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

});

