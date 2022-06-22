/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Listing', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
    childProcess.execSync(`${command} init ${adrDirectory}`, { cwd: workDir });
  });

  afterEach(() => {
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should list an empty directory', async () => {
    const child = childProcess.execSync(`${command} list`, { cwd: workDir });
    const output = child.toString().trim();
    expect(output).toEqual('0001-record-architecture-decisions.md');
  });

  it('should list when there is an additional one', async () => {
    childProcess.execSync(`${command} new first`, { cwd: workDir });
    const child = childProcess.execSync(`${command} list`, { cwd: workDir });
    const output = child.toString().trim();
    expect(output).toEqual('0001-record-architecture-decisions.md\n0002-first.md');
  });

  it('should list when there are more', async () => {
    childProcess.execSync(`${command} new first`, { cwd: workDir });
    childProcess.execSync(`${command} new second`, { cwd: workDir });
    childProcess.execSync(`${command} new third`, { cwd: workDir });
    const child = childProcess.execSync(`${command} list`, { cwd: workDir });
    const output = child.toString().trim();
    expect(output).toEqual('0001-record-architecture-decisions.md\n0002-first.md\n0003-second.md\n0004-third.md');
  });

});

