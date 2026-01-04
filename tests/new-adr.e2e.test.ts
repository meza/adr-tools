import * as fs from 'node:fs';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('New Adrs', () => {
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

  it('should create a new one normally', () => {
    cli.run(['init', adrDirectory], { cwd: workDir });
    cli.run(['new', 'Example', 'ADR'], { cwd: workDir });

    const expectedNewFile: string = path.join(adrDirectory, '0002-example-adr.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });

  it('should create a new one even if no config exists', () => {
    cli.run(['new', 'Example', 'ADR'], { cwd: workDir });

    const expectedNewFile: string = path.join(adrDirectory, '0001-example-adr.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });

  it('should create a table of contents upon creation', () => {
    cli.run(['init', adrDirectory], { cwd: workDir });
    cli.run(['new', 'Example', 'ADR'], { cwd: workDir });

    const expectedNewFile: string = path.join(adrDirectory, 'decisions.md');
    expect(fs.existsSync(expectedNewFile)).toBeTruthy();

    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents).toMatchSnapshot();
  });
});
