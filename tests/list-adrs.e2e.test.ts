import * as childProcess from 'child_process';
import { realpathSync, rmdirSync } from 'node:fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Listing', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx tsx ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = 'doc/adr';
    childProcess.execSync(`${command} init ${adrDirectory}`, { timeout: 3000, cwd: workDir });
  });

  afterEach(() => {
    rmdirSync(workDir, {
      recursive: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should list an empty directory', async () => {
    const child = childProcess.execSync(`${command} list`, { timeout: 3000, cwd: workDir });
    const output = child.toString().trim();
    expect(output).toEqual('doc/adr/0001-record-architecture-decisions.md');
  });

  it('should list when there is an additional one', async () => {
    childProcess.execSync(`${command} new first`, { timeout: 3000, cwd: workDir });
    const child = childProcess.execSync(`${command} list`, { timeout: 3000, cwd: workDir });
    const output = child.toString().trim();
    expect(output).toEqual('doc/adr/0001-record-architecture-decisions.md\ndoc/adr/0002-first.md');
  });

  it('should list when there are more', async () => {
    childProcess.execSync(`${command} new first`, { timeout: 3000, cwd: workDir });
    childProcess.execSync(`${command} new second`, { timeout: 3000, cwd: workDir });
    childProcess.execSync(`${command} new third`, { timeout: 3000, cwd: workDir });
    const child = childProcess.execSync(`${command} list`, { timeout: 3000, cwd: workDir });
    const output = child.toString().trim();
    expect(output).toEqual(
      'doc/adr/0001-record-architecture-decisions.md\ndoc/adr/0002-first.md\ndoc/adr/0003-second.md\ndoc/adr/0004-third.md'
    );
  });
});
