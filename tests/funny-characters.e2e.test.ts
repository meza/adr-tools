import * as childProcess from 'child_process';
import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import os from 'os';
import * as path from 'path';

/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);

describe.skip('Funny Characters', () => {
  const adr: string = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx tsx ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  afterEach(() => {
    fs.rmdirSync(workDir, {
      recursive: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  beforeEach(() => {
    workDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-')));
    adrDirectory = path.resolve(path.join(workDir, 'doc/adr'));
    childProcess.execSync(`${command} init ${adrDirectory}`, { cwd: workDir });
  });

  it('should handle titles with periods in them', async () => {
    childProcess.execSync(`${command} new Something About Node.JS`, { cwd: workDir, timeout: 10000 });
    const expectedFile: string = path.join(adrDirectory, '0002-something-about-node-js.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it.skip('should handle titles with slashes in them', async () => {
    childProcess.execSync(`${command} new Slash/Slash/Slash/`, { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-slash-slash-slash.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it.skip('should handle titles with other weirdness in them', async () => {
    childProcess.execSync(`${command} new -- "-Bar-"`, { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-bar.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });
});
