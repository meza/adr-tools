import { realpathSync, rmSync } from 'node:fs';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Linking Adrs', () => {
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

  it('should link adrs as expected with adr new', async () => {
    cli.run(['new', 'First', 'Record'], { cwd: workDir });
    cli.run(['new', 'Second', 'Record'], { cwd: workDir });
    cli.run(['new', '-q', '-l', '1:Amends:Amended by', '-l', '2:Clarifies:Clarified by', 'Third', 'Record'], {
      cwd: workDir
    });

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

  it('should link adrs as expected with adr link', async () => {
    cli.run(['new', 'First', 'Record'], { cwd: workDir });
    cli.run(['new', 'Second', 'Record'], { cwd: workDir });
    cli.run(['new', 'Third', 'Record'], { cwd: workDir });
    cli.run(['link', '3', 'Amends', '1', 'Amended by'], { cwd: workDir });
    cli.run(['link', '3', 'Clarifies', '2', 'Clarified by'], { cwd: workDir });

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
