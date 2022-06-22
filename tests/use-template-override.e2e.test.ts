/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import childProcess from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

describe('Overriding templates', () => {
  const workDir = path.dirname(__filename);
  const adr: string = path.resolve(workDir, '../src/index.ts');
  const command = `npx ts-node ${adr}`;
  let randomDir = uuidv4();

  afterEach(() => {
    childProcess.execSync(`rm -rf .adr-dir doc tmp ${randomDir}`, { cwd: workDir });
  });

  beforeEach(() => {
    randomDir = uuidv4();
    childProcess.execSync(`${command} init ${randomDir}`, { cwd: workDir });
  });

  it('should use an override template if one exists', async () => {
    const adrDirectory: string = path.resolve(path.join(workDir, randomDir));

    await fs.mkdir(path.join(adrDirectory, 'templates'), { recursive: true });
    await fs.writeFile(path.join(adrDirectory, 'templates', 'template.md'), '# This is an override template\nTITLE\nDATE\nNUMBER\nSTATUS');

    childProcess.execSync(`${command} new Example ADR`, { cwd: workDir });
    childProcess.execSync(`${command} new Another Example ADR`, { cwd: workDir });

    const expectedFile: string = path.join(adrDirectory, '0002-example-adr.md');
    const expectedFile2: string = path.join(adrDirectory, '0003-another-example-adr.md');

    const fileContents = await fs.readFile(expectedFile, 'utf8');
    const fileContents2 = await fs.readFile(expectedFile2, 'utf8');

    expect(fileContents).toMatchSnapshot();
    expect(fileContents2).toMatchSnapshot();
  });
});
