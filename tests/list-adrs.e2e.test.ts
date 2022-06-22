/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import childProcess from 'child_process';
import path from 'path';

import { v4 as uuidv4 } from 'uuid';

describe('Funny Characters', () => {
  const workDir = path.dirname(__filename);
  const adr: string = path.resolve(workDir, '../src/index.ts');
  const command = `npx ts-node ${adr}`;
  let randomDir = uuidv4();

  afterEach(() => {
    childProcess.execSync(`rm -rf .adr-dir doc tmp ${randomDir}`, { cwd: workDir });
  });

  beforeEach(() => {
    randomDir = uuidv4();
    childProcess.execSync(`${command} init ${randomDir}`, { cwd: workDir });
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

