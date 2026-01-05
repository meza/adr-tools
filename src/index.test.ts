import path from 'node:path';
import { pathToFileURL } from 'node:url';
import chalk from 'chalk';
import type { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { buildProgram, defaultOnError, isDirectRun, maybeRun, run } from './index.js';

const createDeps = () => {
  const deps = {
    generateToc: vi.fn(),
    init: vi.fn(),
    link: vi.fn(),
    listAdrs: vi.fn(),
    newAdr: vi.fn(),
    workingDir: vi.fn(),
    readFile: vi.fn(),
    getLinksFrom: vi.fn(),
    getTitleFrom: vi.fn(),
    version: '1.2.3',
    onError: vi.fn(),
    log: vi.fn()
  };

  return deps;
};

describe('adr CLI', () => {
  it('wires program metadata', () => {
    const deps = createDeps();
    const program = buildProgram(deps);
    expect(program.name()).toEqual('adr');
    expect(program.version()).toEqual('1.2.3');
  });

  it('runs the new command with options', async () => {
    const deps = createDeps();
    await run(['node', 'adr', 'new', 'My', 'ADR', '--open'], deps);
    expect(deps.newAdr).toHaveBeenCalledWith('My ADR', {
      supersedes: [],
      date: process.env.ADR_DATE,
      suppressPrompts: false,
      links: [],
      open: true,
      openWith: undefined
    });
  });

  it('invokes error handler when newAdr fails', async () => {
    const deps = createDeps();
    deps.newAdr.mockRejectedValueOnce(new Error('boom'));
    await run(['node', 'adr', 'new', 'My', 'ADR'], deps);
    expect(deps.onError).toHaveBeenCalled();
  });

  it('routes generate toc', async () => {
    const deps = createDeps();
    await run(['node', 'adr', 'generate', 'toc', '-p', '/prefix/'], deps);
    expect(deps.generateToc).toHaveBeenCalledWith({ prefix: '/prefix/' });
  });

  it('generates graph output', async () => {
    const deps = createDeps();
    deps.listAdrs.mockResolvedValue(['/repo/doc/adr/0001-one.md', '/repo/doc/adr/0002-two.md']);
    deps.readFile.mockResolvedValue('# Title');
    deps.getTitleFrom.mockReturnValue('ADR Title');
    deps.getLinksFrom.mockReturnValue([
      { label: 'Relates to', targetNumber: '0002' },
      { label: 'Superseded by', targetNumber: '0003' }
    ]);
    await run(['node', 'adr', 'generate', 'graph', '-e', '.md', '-p', '/p/'], deps);
    const output = deps.log.mock.calls[0][0] as string;
    expect(output).toContain('digraph');
    expect(output).toContain('_1 -> _2 [style="dotted"');
    expect(output).toContain('label="Relates to"');
    expect(output).not.toContain('Superseded by');
  });

  it('generates graph output with default prefix', async () => {
    const deps = createDeps();
    deps.listAdrs.mockResolvedValue(['/repo/doc/adr/0001-one.md']);
    deps.readFile.mockResolvedValue('# Title');
    deps.getTitleFrom.mockReturnValue('ADR Title');
    deps.getLinksFrom.mockReturnValue([]);
    await run(['node', 'adr', 'generate', 'graph'], deps);
    const output = deps.log.mock.calls[0][0] as string;
    expect(output).toContain('0001-one.html');
  });

  it('escapes graph labels and urls', async () => {
    const deps = createDeps();
    deps.listAdrs.mockResolvedValue(['/repo/doc/adr/0001-one.md']);
    deps.readFile.mockResolvedValue('# Title');
    deps.getTitleFrom.mockReturnValue('ADR "Title" \\\\ path\nline');
    deps.getLinksFrom.mockReturnValue([]);
    await run(['node', 'adr', 'generate', 'graph', '-e', '.md', '-p', '/p/"weird"/'], deps);
    const output = deps.log.mock.calls[0][0] as string;
    const match = output.match(/label="([\s\S]*?)"; URL="([^"]+)"/);
    expect(match?.[1]).toContain(String.raw`ADR \"Title\" \\\\ path\\nline`);
    expect(match?.[1]).not.toContain('\n');
    expect(output).toContain(String.raw`URL="/p/\"weird\"/0001-one.md"`);
  });

  it('routes link command', async () => {
    const deps = createDeps();
    await run(['node', 'adr', 'link', '1', 'Amends', '2', 'Amended by'], deps);
    const call = deps.link.mock.calls[0];
    expect(call.slice(0, 4)).toEqual(['1', 'Amends', '2', 'Amended by']);
  });

  it('routes init command', async () => {
    const deps = createDeps();
    await run(['node', 'adr', 'init', 'doc/adr'], deps);
    expect(deps.init).toHaveBeenCalledWith('doc/adr');
  });

  it('lists adrs relative to working dir', async () => {
    const deps = createDeps();
    deps.listAdrs.mockResolvedValue(['/repo/doc/adr/0001-one.md']);
    deps.workingDir.mockReturnValue('/repo');
    await run(['node', 'adr', 'list'], deps);
    expect(deps.log).toHaveBeenCalledWith(path.join('doc', 'adr', '0001-one.md'));
  });

  it('collects repeated options for links and supersedes', async () => {
    const deps = createDeps();
    await run(
      [
        'node',
        'adr',
        'new',
        'My',
        'ADR',
        '-l',
        '1:Links:Linked by',
        '-l',
        '2:Relates:Related by',
        '-s',
        '1',
        '-s',
        '2'
      ],
      deps
    );
    const [, options] = deps.newAdr.mock.calls[0];
    expect(options.links).toEqual(['1:Links:Linked by', '2:Relates:Related by']);
    expect(options.supersedes).toEqual(['1', '2']);
  });

  it('detects direct runs based on argv', () => {
    const indexPath = path.resolve(process.cwd(), 'src/index.ts');
    const moduleUrl = pathToFileURL(indexPath).href;
    expect(isDirectRun(['node', indexPath], moduleUrl)).toBe(true);
    expect(isDirectRun(['node'], moduleUrl)).toBe(false);
  });

  it('returns false when maybeRun is not direct', () => {
    const deps = createDeps();
    expect(maybeRun(['node', '/other/entry'], deps)).toBe(false);
  });

  it('runs when maybeRun detects direct execution', async () => {
    const deps = createDeps();
    deps.listAdrs.mockResolvedValue([]);
    const indexPath = path.resolve(process.cwd(), 'src/index.ts');
    expect(maybeRun(['node', indexPath, 'list'], deps)).toBe(true);
    expect(deps.listAdrs).toHaveBeenCalled();
  });

  it('formats errors with the default handler', () => {
    const errorHandler = vi.fn();
    const program = { error: errorHandler } as unknown as Command;
    defaultOnError(program, new Error('boom'));
    expect(errorHandler).toHaveBeenCalledWith(chalk.red('boom'), { exitCode: 1 });
  });
});
