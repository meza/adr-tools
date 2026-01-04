import * as childProcess from 'child_process';
import { realpathSync, rmdirSync } from 'node:fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
/* eslint-disable no-sync */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('Generating Graphs', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx -y tsx ${adr}`;
  let workDir: string;

  beforeAll(async () => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    childProcess.execSync(`${command} init`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new An idea that seems good at the time`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new -s 2 A better idea`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new This will work`, { timeout: 10000, cwd: workDir });
    childProcess.execSync(`${command} new -s 3 The end`, { timeout: 10000, cwd: workDir });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    rmdirSync(workDir, {
      recursive: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should generate a graph', async () => {
    const child = childProcess.execSync(`${command} generate graph`, { timeout: 10000, cwd: workDir });
    const childContent = child.toString().trim();

    expect(childContent).toMatchSnapshot();
  });

  it('should generate a graph with specified route and extension ', async () => {
    const child = childProcess.execSync(`${command} generate graph -p http://example.com/ -e .xxx`, {
      timeout: 10000,
      cwd: workDir
    });
    const childContent = child.toString().trim();

    expect(childContent).toMatchSnapshot();
  });
});
