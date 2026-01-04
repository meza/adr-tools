import * as fs from 'node:fs';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Init an ADR Repository', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = path.resolve(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = path.join(workDir, 'doc/adr');
  });

  afterEach(() => {
    fs.rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should use the default directory', () => {
    cli.run(['init'], { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0001-record-architecture-decisions.md');
    const expectedLockFile: string = path.join(adrDirectory, '.adr-sequence.lock');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
    expect(fs.existsSync(expectedLockFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedFile, 'utf8');
    const lockFileContents = fs.readFileSync(expectedLockFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
    expect(lockFileContents).toEqual('1');
  });

  it('should use an alternate directory', () => {
    const directory: string = path.resolve(path.join(workDir, 'tmp', 'alternative-dir'));
    cli.run(['init', directory], { cwd: workDir });

    const expectedInitFile: string = path.join(directory, '0001-record-architecture-decisions.md');
    const expectedLockFile: string = path.join(directory, '.adr-sequence.lock');
    expect(fs.existsSync(expectedInitFile)).toBeTruthy();
    expect(fs.existsSync(expectedLockFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedInitFile, 'utf8');
    const lockFileContents = fs.readFileSync(expectedLockFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
    expect(lockFileContents).toEqual('1');
  });
});
