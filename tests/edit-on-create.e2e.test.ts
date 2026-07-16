import * as fs from 'node:fs';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

const waitForFile = async (filePath: string, timeoutMs: number) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Timed out waiting for file: ${filePath}`);
};

describe('Edit new Adrs on creation', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);
  const visualHelper =
    process.platform === 'win32'
      ? path.resolve(path.dirname(__filename), './fake-visual.cmd')
      : path.resolve(path.dirname(__filename), './fake-visual');
  const editorHelper =
    process.platform === 'win32'
      ? path.resolve(path.dirname(__filename), './fake-editor.cmd')
      : path.resolve(path.dirname(__filename), './fake-editor');

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-')));
    adrDirectory = path.resolve(path.join(workDir, 'doc/adr'));
  });

  afterEach(() => {
    fs.rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should open a new ADR in the VISUAL', async () => {
    cli.run(['new', '--open', 'Example', 'ADR'], {
      cwd: workDir,
      env: { VISUAL: visualHelper }
    });

    const expectedNewFile: string = path.join(workDir, 'visual.out');
    await waitForFile(expectedNewFile, 2000);
    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    const reported = fileContents.trim().replace(/^VISUAL\s+/, '');
    expect(path.normalize(reported)).toEqual(path.normalize(`${adrDirectory}/0001-example-adr.md`));
  });

  it('should open a new ADR in the EDITOR', async () => {
    cli.run(['new', '--open', 'Example', 'ADR'], {
      cwd: workDir,
      env: { EDITOR: editorHelper }
    });

    const expectedNewFile: string = path.join(workDir, 'editor.out');
    await waitForFile(expectedNewFile, 2000);
    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    const reported = fileContents.trim().replace(/^EDITOR\s+/, '');
    expect(path.normalize(reported)).toEqual(path.normalize(`${adrDirectory}/0001-example-adr.md`));
  });

  it('should open a new ADR in the VISUAL if both VISUAL and EDITOR is supplied', async () => {
    cli.run(['new', '--open', 'Example', 'ADR'], {
      cwd: workDir,
      env: { EDITOR: editorHelper, VISUAL: visualHelper }
    });

    expect(fs.existsSync(path.join(workDir, 'editor.out'))).toBeFalsy();

    const expectedNewFile: string = path.join(workDir, 'visual.out');
    await waitForFile(expectedNewFile, 2000);
    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    const reported = fileContents.trim().replace(/^VISUAL\s+/, '');
    expect(path.normalize(reported)).toEqual(path.normalize(`${adrDirectory}/0001-example-adr.md`));
  });
});
