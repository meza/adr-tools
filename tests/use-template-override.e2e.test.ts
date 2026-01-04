import { realpathSync, rmSync } from 'node:fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Overriding templates', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = path.join(workDir, 'doc/adr');
    cli.run(['init', adrDirectory], { cwd: workDir });
  });

  afterEach(() => {
    rmSync(workDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 500
    });
  });

  it('should use an override template if one exists', async () => {
    await fs.mkdir(path.join(adrDirectory, 'templates'), { recursive: true });
    await fs.writeFile(
      path.join(adrDirectory, 'templates', 'template.md'),
      '# This is an override template\nTITLE\nDATE\nNUMBER\nSTATUS'
    );

    cli.run(['new', 'Example', 'ADR'], { cwd: workDir });
    cli.run(['new', 'Another', 'Example', 'ADR'], { cwd: workDir });

    const expectedFile: string = path.join(adrDirectory, '0002-example-adr.md');
    const expectedFile2: string = path.join(adrDirectory, '0003-another-example-adr.md');

    const fileContents = await fs.readFile(expectedFile, 'utf8');
    const fileContents2 = await fs.readFile(expectedFile2, 'utf8');

    expect(fileContents).toMatchSnapshot();
    expect(fileContents2).toMatchSnapshot();
  });
});
