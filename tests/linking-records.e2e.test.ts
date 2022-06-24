/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Linking Adrs', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
  });

  afterEach(() => {
    vi.clearAllMocks();
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should link adrs as expected', async () => {
    childProcess.execSync(`${command} new First Record`, { cwd: workDir });
    childProcess.execSync(`${command} new Second Record`, { cwd: workDir });
    childProcess.execSync(`${command} new -q -l "1:Amends:Amended by" -l "2:Clarifies:Clarified by" Third Record`, { cwd: workDir });

    const first: string = path.join(adrDirectory, '0001-first-record.md');
    const second: string = path.join(adrDirectory, '0002-second-record.md');
    const third: string = path.join(adrDirectory, '0003-third-record.md');

    const firstContent = await fs.readFile(first, 'utf8');
    const secondContent = await fs.readFile(second, 'utf8');
    const thirdContent = await fs.readFile(third, 'utf8');

    expect(firstContent.replace(/\d{4}-\d{2}-\d{2}/, 'DATE-STRING-HERE')).toMatchSnapshot();
    expect(secondContent.replace(/\d{4}-\d{2}-\d{2}/, 'DATE-STRING-HERE')).toMatchSnapshot();
    expect(thirdContent.replace(/\d{4}-\d{2}-\d{2}/, 'DATE-STRING-HERE')).toMatchSnapshot();
  });
});
