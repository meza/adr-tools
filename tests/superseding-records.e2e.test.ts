import * as childProcess from 'child_process';
import { realpathSync, rmdirSync } from 'node:fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Superseding Adrs', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx tsx ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = path.join(workDir, 'doc/adr');
  });

  afterEach(() => {
    vi.clearAllMocks();
    rmdirSync(workDir, {
      recursive: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should be able to supersede previous adrs', async () => {
    childProcess.execSync(`${command} new First Record`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new -s 1 Second Record`, { timeout: 10000, cwd: workDir });

    const first: string = path.join(adrDirectory, '0001-first-record.md');
    const second: string = path.join(adrDirectory, '0002-second-record.md');

    const firstContent = await fs.readFile(first, 'utf8');
    const secondContent = await fs.readFile(second, 'utf8');

    expect(firstContent).toMatchSnapshot();
    expect(secondContent).toMatchSnapshot();
  });

  it('should be able to supersede multiple records', async () => {
    childProcess.execSync(`${command} new First Record`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new Second Record`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new -s 1 -s 2 Third Record`, { timeout: 10000, cwd: workDir });

    const first: string = path.join(adrDirectory, '0001-first-record.md');
    const second: string = path.join(adrDirectory, '0002-second-record.md');
    const third: string = path.join(adrDirectory, '0003-third-record.md');

    const firstContent = await fs.readFile(first, 'utf8');
    const secondContent = await fs.readFile(second, 'utf8');
    const thirdContent = await fs.readFile(third, 'utf8');

    expect(firstContent).toMatchSnapshot();
    expect(secondContent).toMatchSnapshot();
    expect(thirdContent).toMatchSnapshot();
  });
});
