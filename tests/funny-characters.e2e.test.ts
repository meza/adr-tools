/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

describe('Funny Characters', () => {
  const workDir = path.dirname(__filename);
  const adr: string = path.resolve(workDir, '../src/index.ts');
  const command = `npx tsx ${adr}`;
  let randomDir = uuidv4();
  let adrDirectory: string;

  afterEach(() => {
    childProcess.execSync(`rimraf .adr-dir doc tmp ${randomDir}`, { cwd: workDir });
  });

  beforeEach(() => {
    randomDir = uuidv4();
    adrDirectory = path.resolve(path.join(workDir, randomDir));
    childProcess.execSync(`${command} init ${randomDir}`, { cwd: workDir });
  });

  it('should handle titles with periods in them', async () => {
    childProcess.execSync(`${command} new Something About Node.JS`, { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-something-about-node-js.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it('should handle titles with slashes in them', async () => {
    childProcess.execSync(`${command} new Slash/Slash/Slash/`, { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-slash-slash-slash.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });

  it('should handle titles with other weirdness in them', async () => {
    childProcess.execSync(`${command} new -- "-Bar-"`, { cwd: workDir });
    const expectedFile: string = path.join(adrDirectory, '0002-bar.md');
    expect(fs.existsSync(expectedFile)).toBeTruthy();
  });
});

