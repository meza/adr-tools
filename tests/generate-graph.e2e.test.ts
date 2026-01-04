import { realpathSync, rmSync } from 'node:fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
/* eslint-disable no-sync */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Generating Graphs', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);
  let workDir: string;

  beforeAll(async () => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    cli.run(['init'], { cwd: workDir });
    cli.run(['new', 'An', 'idea', 'that', 'seems', 'good', 'at', 'the', 'time'], { cwd: workDir });
    cli.run(['new', '-s', '2', 'A', 'better', 'idea'], { cwd: workDir });
    cli.run(['new', 'This', 'will', 'work'], { cwd: workDir });
    cli.run(['new', '-s', '3', 'The', 'end'], { cwd: workDir });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should generate a graph', async () => {
    const childContent = cli.run(['generate', 'graph'], { cwd: workDir });

    expect(childContent).toMatchSnapshot();
  });

  it('should generate a graph with specified route and extension ', async () => {
    const childContent = cli.run(['generate', 'graph', '-p', 'http://example.com/', '-e', '.xxx'], { cwd: workDir });

    expect(childContent).toMatchSnapshot();
  });
});
