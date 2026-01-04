import * as fs from 'node:fs';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('deep directories', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    workDir = path.resolve(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = path.join(workDir, 'doc/adr');
    cli.run(['init', adrDirectory], { cwd: workDir });
  });

  afterEach(() => {
    fs.rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('can work', () => {
    const innerPath = path.join(fs.mkdtempSync(path.resolve(workDir) + '/'), 'inner');
    fs.mkdirSync(innerPath, { recursive: true });
    cli.run(['new', 'this', 'should', 'exist'], { cwd: innerPath });
    const expectedFile: string = path.join(adrDirectory, '0002-this-should-exist.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it('can work when there has been no config initiated', () => {
    fs.rmSync(adrDirectory, { recursive: true, force: true });
    fs.rmSync(path.join(workDir, '.adr-dir'), { force: true });

    const innerPath = path.join(fs.mkdtempSync(path.resolve(workDir) + '/'), 'inner');
    fs.mkdirSync(innerPath, { recursive: true });
    cli.run(['new', 'this', 'should', 'exist'], { cwd: innerPath });
    const expectedFile: string = path.join(innerPath, 'doc', 'adr', '0001-this-should-exist.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });
});
