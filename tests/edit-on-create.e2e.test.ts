/* eslint-disable no-sync */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Edit new Adrs on creation', () => {
  const adr = path.resolve(path.dirname(__filename), '../src/index.ts');
  const command = `npx ts-node ${adr}`;
  const visualHelper = path.resolve(path.dirname(__filename), './fake-visual');
  const editorHelper = path.resolve(path.dirname(__filename), './fake-editor');

  let adrDirectory: string;
  let workDir: string;

  beforeEach(() => {
    // @ts-ignore
    process.env.ADR_DATE = '1992-01-12';
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'));
    adrDirectory = path.join(workDir, 'doc/adr');
  });

  afterEach(() => {
    childProcess.execSync(`rm -rf ${workDir}`);
  });

  it('should open a new ADR in the VISUAL', () => {
    childProcess.execSync(`VISUAL="${visualHelper}" ${command} new Example ADR`, { cwd: workDir });

    const expectedNewFile: string = path.join(workDir, 'visual.out');
    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents.trim()).toEqual(`VISUAL ${adrDirectory}/0001-example-adr.md`);
  });

  it('should open a new ADR in the EDITOR', () => {
    childProcess.execSync(`EDITOR="${editorHelper}" ${command} new Example ADR`, { cwd: workDir });

    const expectedNewFile: string = path.join(workDir, 'editor.out');
    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents.trim()).toEqual(`EDITOR ${adrDirectory}/0001-example-adr.md`);
  });

  it('should open a new ADR in the VISUAL if both VISUAL and EDITOR is supplied', () => {
    childProcess.execSync(`EDITOR="${editorHelper}" VISUAL="${visualHelper}" ${command} new Example ADR`, { cwd: workDir });

    expect(fs.existsSync(path.join(workDir, 'editor.out'))).toBeFalsy();

    const expectedNewFile: string = path.join(workDir, 'visual.out');
    const fileContents = fs.readFileSync(expectedNewFile, 'utf8');
    expect(fileContents.trim()).toEqual(`VISUAL ${adrDirectory}/0001-example-adr.md`);
  });

});
