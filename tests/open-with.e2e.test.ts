import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAdrCli } from './helpers/adr-cli';

const waitForFile = async (filePath: string, timeoutMs: number) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`Timed out waiting for file: ${filePath}`);
};

describe('--open-with', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const cli = createAdrCli(adr);
  const visualHelper =
    process.platform === 'win32'
      ? path.resolve(path.dirname(__filename), './fake-visual.cmd')
      : path.resolve(path.dirname(__filename), './fake-visual');

  let workDir: string;
  let adrDirectory: string;

  beforeEach(() => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'adr-')));
    adrDirectory = path.resolve(path.join(workDir, 'doc/adr'));
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  });

  it('opens the created ADR with the provided command', async () => {
    cli.run(['new', '--open-with', visualHelper, 'Example', 'ADR'], { cwd: workDir });

    const expectedOpenMarker: string = path.join(workDir, 'visual.out');
    await waitForFile(expectedOpenMarker, 2000);

    const contents = fs.readFileSync(expectedOpenMarker, 'utf8').trim();
    const openedPath = contents.replace(/^VISUAL\s+/, '');
    expect(path.normalize(openedPath)).toEqual(path.normalize(`${adrDirectory}/0001-example-adr.md`));
  });
});
