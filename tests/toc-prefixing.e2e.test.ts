import { realpathSync, rmSync } from 'node:fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Generating TOC', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);

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
    rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should add a path prefix to the toc when there is one supplied', async () => {
    cli.run(['new', 'First', 'Record'], { cwd: workDir });
    cli.run(['new', 'Second', 'Record'], { cwd: workDir });
    cli.run(['new', 'Third', 'Record'], { cwd: workDir });
    cli.run(['generate', 'toc', '-p', 'foo/doc/adr/'], { cwd: workDir });

    const tocFilePath: string = path.join(adrDirectory, 'decisions.md');
    const tocContent = await fs.readFile(tocFilePath, 'utf8');
    expect(tocContent).toMatchSnapshot();
  });
});
