import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'os';
import * as path from 'path';

/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

const __filename = fileURLToPath(import.meta.url);

describe.skip('Funny Characters', () => {
  const adr: string = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);

  let adrDirectory: string;
  let workDir: string;

  afterEach(() => {
    fs.rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  beforeEach(() => {
    workDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-')));
    adrDirectory = path.resolve(path.join(workDir, 'doc/adr'));
    cli.run(['init', adrDirectory], { cwd: workDir });
  });

  it('should handle titles with periods in them', async () => {
    cli.run(['new', 'Something', 'About', 'Node.JS'], { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-something-about-node-js.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it.skip('should handle titles with slashes in them', async () => {
    cli.run(['new', 'Slash/Slash/Slash/'], { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-slash-slash-slash.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it.skip('should handle titles with other weirdness in them', async () => {
    cli.run(['new', '--', '-Bar-'], { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-bar.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });
});
