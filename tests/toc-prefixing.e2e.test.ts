/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Generating TOC', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx tsx ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
  });

  afterEach(() => {
    vi.clearAllMocks();
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should add a path prefix to the toc when there is one supplied', async () => {
    childProcess.execSync(`${command} new First Record`, { cwd: workDir });
    childProcess.execSync(`${command} new Second Record`, { cwd: workDir });
    childProcess.execSync(`${command} new Third Record`, { cwd: workDir });
    childProcess.execSync(`${command} generate toc -p foo/doc/adr/`, { cwd: workDir });

    const tocFilePath: string = path.join(adrDirectory, 'decisions.md');
    const tocContent = await fs.readFile(tocFilePath, 'utf8');
    expect(tocContent).toMatchSnapshot();
  });

});
