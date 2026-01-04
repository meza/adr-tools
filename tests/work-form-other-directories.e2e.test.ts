import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('deep directories', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx -y tsx ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    workDir = path.resolve(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = path.join(workDir, 'doc/adr');
    childProcess.execSync(`${command} init ${adrDirectory}`, { timeout: 10000, cwd: workDir });
  });

  afterEach(() => {
    fs.rmdirSync(workDir, {
      recursive: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('can work', () => {
    const innerPath = path.join(fs.mkdtempSync(path.resolve(workDir) + '/'), 'inner');
    fs.mkdirSync(innerPath, { recursive: true });
    childProcess.execSync(`${command} new this should exist`, { timeout: 10000, cwd: innerPath });
    const expectedFile: string = path.join(adrDirectory, '0002-this-should-exist.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it('can work when there has been no config initiated', () => {
    childProcess.execSync(`rimraf ${adrDirectory} ${workDir}/.adr-dir`);

    const innerPath = path.join(fs.mkdtempSync(path.resolve(workDir) + '/'), 'inner');
    fs.mkdirSync(innerPath, { recursive: true });
    childProcess.execSync(`${command} new this should exist`, { timeout: 10000, cwd: innerPath });
    const expectedFile: string = path.join(innerPath, 'doc', 'adr', '0001-this-should-exist.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });
});
