/* eslint-disable no-sync */
import { describe, it, expect, afterAll, beforeAll, vi, afterEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { realpathSync } from 'node:fs';

describe('Generating Graphs', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx tsx ${adr}`;
  let workDir: string;

  beforeAll(async () => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    childProcess.execSync(`${command} init`, { cwd: workDir });
    childProcess.execSync(`${command} new An idea that seems good at the time`, { cwd: workDir });
    childProcess.execSync(`${command} new -s 2 A better idea`, { cwd: workDir });
    childProcess.execSync(`${command} new This will work`, { cwd: workDir });
    childProcess.execSync(`${command} new -s 3 The end`, { cwd: workDir });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    childProcess.execSync(`rimraf ${workDir}`);
  });

  it('should generate a graph', async () => {
    const child = childProcess.execSync(`${command} generate graph`, { cwd: workDir });
    const childContent = child.toString().trim();

    expect(childContent).toMatchSnapshot();
  });

  it('should generate a graph with specified route and extension ', async () => {
    const child = childProcess.execSync(`${command} generate graph -p http://example.com/ -e .xxx`, { cwd: workDir });
    const childContent = child.toString().trim();

    expect(childContent).toMatchSnapshot();
  });
});
