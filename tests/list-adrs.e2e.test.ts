import { realpathSync, rmSync } from 'node:fs';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
/* eslint-disable no-sync */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

describe('Listing', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    workDir = path.resolve(realpathSync(await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'))));
    adrDirectory = 'doc/adr';
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

  it('should list an empty directory', async () => {
    const output = cli.run(['list'], { cwd: workDir }).replace(/\r\n/g, '\n');
    expect(output).toEqual(path.join('doc', 'adr', '0001-record-architecture-decisions.md'));
  });

  it('should list when there is an additional one', async () => {
    cli.run(['new', 'first'], { cwd: workDir });
    const output = cli.run(['list'], { cwd: workDir }).replace(/\r\n/g, '\n');
    expect(output).toEqual(
      [path.join('doc', 'adr', '0001-record-architecture-decisions.md'), path.join('doc', 'adr', '0002-first.md')].join(
        '\n'
      )
    );
  });

  it('should list when there are more', async () => {
    cli.run(['new', 'first'], { cwd: workDir });
    cli.run(['new', 'second'], { cwd: workDir });
    cli.run(['new', 'third'], { cwd: workDir });
    const output = cli.run(['list'], { cwd: workDir }).replace(/\r\n/g, '\n');
    expect(output).toEqual(
      [
        path.join('doc', 'adr', '0001-record-architecture-decisions.md'),
        path.join('doc', 'adr', '0002-first.md'),
        path.join('doc', 'adr', '0003-second.md'),
        path.join('doc', 'adr', '0004-third.md')
      ].join('\n')
    );
  });
});
