import { realpathSync, rmSync } from 'node:fs';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Superseding Adrs', () => {
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

  it('should be able to supersede previous adrs', async () => {
    cli.run(['new', 'First', 'Record'], { cwd: workDir });
    cli.run(['new', '-s', '1', 'Second', 'Record'], { cwd: workDir });

    const first: string = path.join(adrDirectory, '0001-first-record.md');
    const second: string = path.join(adrDirectory, '0002-second-record.md');

    const firstContent = await fs.readFile(first, 'utf8');
    const secondContent = await fs.readFile(second, 'utf8');

    expect(firstContent).toMatchSnapshot();
    expect(secondContent).toMatchSnapshot();
  });

  it('should be able to supersede multiple records', async () => {
    cli.run(['new', 'First', 'Record'], { cwd: workDir });
    cli.run(['new', 'Second', 'Record'], { cwd: workDir });
    cli.run(['new', '-s', '1', '-s', '2', 'Third', 'Record'], { cwd: workDir });

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
