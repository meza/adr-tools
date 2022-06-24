/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Overriding templates', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx ts-node ${adr}`;

  let adrDirectory: string;
  let workDir: string;

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
    childProcess.execSync(`${command} init ${adrDirectory}`, { cwd: workDir });
  });

  afterEach(() => {
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should use an override template if one exists', async () => {
    await fs.mkdir(path.join(adrDirectory, 'templates'), { recursive: true });
    await fs.writeFile(path.join(adrDirectory, 'templates', 'template.md'), '# This is an override template\nTITLE\nDATE\nNUMBER\nSTATUS');

    childProcess.execSync(`${command} new Example ADR`, { cwd: workDir });
    childProcess.execSync(`${command} new Another Example ADR`, { cwd: workDir });

    const expectedFile: string = path.join(adrDirectory, '0002-example-adr.md');
    const expectedFile2: string = path.join(adrDirectory, '0003-another-example-adr.md');

    const fileContents = await fs.readFile(expectedFile, 'utf8');
    const fileContents2 = await fs.readFile(expectedFile2, 'utf8');

    expect(fileContents.replace(/\d{4}-\d{2}-\d{2}/, 'DATE-STRING-HERE')).toMatchSnapshot();
    expect(fileContents2.replace(/\d{4}-\d{2}-\d{2}/, 'DATE-STRING-HERE')).toMatchSnapshot();
  });
});
