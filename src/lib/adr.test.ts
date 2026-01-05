import fs from 'fs/promises';
import open from 'open';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateToc, init, link, listAdrs, newAdr } from './adr.js';
import { getDir, workingDir } from './config.js';
import { findMatchingFilesFor, getLinkDetails } from './links.js';
import { getTitleFrom, injectLink, supersede } from './manipulator.js';
import { newNumber } from './numbering.js';
import { askForClarification } from './prompt.js';
import { template } from './template.js';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn()
  }
}));
vi.mock('open', () => ({ default: vi.fn() }));
vi.mock('./config.js', () => ({
  getDir: vi.fn(),
  workingDir: vi.fn()
}));
vi.mock('./links.js', () => ({
  getLinkDetails: vi.fn(),
  findMatchingFilesFor: vi.fn()
}));
vi.mock('./manipulator.js', () => ({
  getTitleFrom: vi.fn(),
  injectLink: vi.fn(),
  supersede: vi.fn()
}));
vi.mock('./numbering.js', () => ({
  newNumber: vi.fn()
}));
vi.mock('./prompt.js', () => ({
  askForClarification: vi.fn()
}));
vi.mock('./template.js', () => ({
  template: vi.fn()
}));

describe('adr helpers', () => {
  const mockReaddir = vi.mocked(fs.readdir) as unknown as {
    mockResolvedValueOnce: (value: string[]) => void;
  };

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it('generates the toc from adr files', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce(['0001-first.md', 'notes.txt']);
    vi.mocked(fs.readFile).mockResolvedValueOnce('# First ADR');
    vi.mocked(getTitleFrom).mockReturnValueOnce('ADR 1: First');

    await generateToc({ prefix: '/p/' });
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve('/repo/doc/adr', 'decisions.md'),
      '# Table of Contents\n\n- [ADR 1: First](/p/0001-first.md)'
    );
  });

  it('generates the toc without a prefix', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce(['0001-first.md']);
    vi.mocked(fs.readFile).mockResolvedValueOnce('# First ADR');
    vi.mocked(getTitleFrom).mockReturnValueOnce('ADR 1: First');

    await generateToc();
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve('/repo/doc/adr', 'decisions.md'),
      '# Table of Contents\n\n- [ADR 1: First](0001-first.md)'
    );
  });

  it('includes ADRs with more than four digits', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce(['10000-future.md']);
    vi.mocked(fs.readFile).mockResolvedValueOnce('# Future ADR');
    vi.mocked(getTitleFrom).mockReturnValueOnce('ADR 10000: Future');

    await generateToc();
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve('/repo/doc/adr', 'decisions.md'),
      '# Table of Contents\n\n- [ADR 10000: Future](10000-future.md)'
    );
  });

  it('excludes ADRs with fewer than four digits', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce(['123-short.md', '0001-first.md']);
    vi.mocked(fs.readFile).mockResolvedValueOnce('# First ADR');
    vi.mocked(getTitleFrom).mockReturnValueOnce('ADR 1: First');

    await generateToc();
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve('/repo/doc/adr', 'decisions.md'),
      '# Table of Contents\n\n- [ADR 1: First](0001-first.md)'
    );
  });

  it('creates a new adr without opening', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(1);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);

    await newAdr('Example ADR', { open: false, date: 'DATE' });
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve('/repo/doc/adr', '0001-example-adr.md'),
      'DATE\nExample ADR\n1\nAccepted\n'
    );
    expect(open).not.toHaveBeenCalled();
  });

  it('falls back to error date when the system date is empty', async () => {
    const dateSpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('');
    vi.mocked(newNumber).mockResolvedValueOnce(1);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);

    await newAdr('Example ADR', { open: false });
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.resolve('/repo/doc/adr', '0001-example-adr.md'),
      'ERROR\nExample ADR\n1\nAccepted\n'
    );
    dateSpy.mockRestore();
  });

  it('opens adr using open-with when provided', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(1);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);

    await newAdr('Example ADR', { openWith: 'code --wait' });
    const adrPath = path.resolve('/repo/doc/adr', '0001-example-adr.md');
    expect(open).toHaveBeenCalledWith(adrPath, {
      app: { name: 'code', arguments: ['--wait'] },
      wait: false
    });
  });

  it('opens adr with default opener when enabled without an editor', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(1);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);

    await newAdr('Example ADR', { open: true });
    expect(open).toHaveBeenCalledWith(path.resolve('/repo/doc/adr', '0001-example-adr.md'), { wait: false });
  });

  it('uses open on windows for open-with', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    vi.mocked(newNumber).mockResolvedValueOnce(1);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);

    try {
      await newAdr('Example ADR', { openWith: 'code --wait' });
      expect(open).toHaveBeenCalledWith(path.resolve('/repo/doc/adr', '0001-example-adr.md'), {
        app: { name: 'code', arguments: ['--wait'] },
        wait: false
      });
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    }
  });

  it('links superseded adrs when provided', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(2);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);
    vi.mocked(fs.readFile).mockResolvedValue('# ADR\n');
    vi.mocked(getTitleFrom).mockReturnValue('ADR Title');
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Supersedes',
      reverseLink: 'Superseded by',
      matches: ['0001-first.md'],
      original: '1',
      pattern: '1'
    });

    await newAdr('Next ADR', { supersedes: ['1'] });
    expect(supersede).toHaveBeenCalled();
    expect(injectLink).toHaveBeenCalled();
  });

  it('asks for clarification when multiple supersede matches exist', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(2);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);
    vi.mocked(fs.readFile).mockResolvedValue('# ADR\n');
    vi.mocked(getTitleFrom).mockReturnValue('ADR Title');
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Supersedes',
      reverseLink: 'Superseded by',
      matches: ['0001-first.md', '0001-other.md'],
      original: '1',
      pattern: '1'
    });
    vi.mocked(askForClarification).mockResolvedValue('0001-other.md');

    await newAdr('Next ADR', { supersedes: ['1'] });
    expect(askForClarification).toHaveBeenCalled();
  });

  it('throws when multiple supersede matches exist in quiet mode', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(2);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Supersedes',
      reverseLink: 'Superseded by',
      matches: ['0001-first.md', '0001-other.md'],
      original: '1',
      pattern: '1'
    });

    await expect(newAdr('Next ADR', { supersedes: ['1'], suppressPrompts: true })).rejects.toThrow(
      'Multiple files match the search pattern'
    );
  });

  it('links related adrs when provided', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(2);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);
    vi.mocked(fs.readFile).mockResolvedValue('# ADR\n');
    vi.mocked(getTitleFrom).mockReturnValue('ADR Title');
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Relates to',
      reverseLink: 'Related by',
      matches: ['0001-first.md'],
      original: '1:Relates to:Related by',
      pattern: '1'
    });

    await newAdr('Next ADR', { links: ['1:Relates to:Related by'] });
    expect(injectLink).toHaveBeenCalled();
  });

  it('asks for clarification when multiple link matches exist', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(2);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce([]);
    vi.mocked(fs.readFile).mockResolvedValue('# ADR\n');
    vi.mocked(getTitleFrom).mockReturnValue('ADR Title');
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Relates to',
      reverseLink: 'Related by',
      matches: ['0001-first.md', '0001-other.md'],
      original: '1:Relates to:Related by',
      pattern: '1'
    });
    vi.mocked(askForClarification).mockResolvedValue('0001-first.md');

    await newAdr('Next ADR', { links: ['1:Relates to:Related by'] });
    expect(askForClarification).toHaveBeenCalled();
  });

  it('initializes a new adr directory', async () => {
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    vi.mocked(workingDir).mockReturnValue('/repo');
    vi.mocked(newNumber).mockResolvedValue(1);
    vi.mocked(template).mockResolvedValue('DATE\nTITLE\nNUMBER\nSTATUS\n');
    mockReaddir.mockResolvedValueOnce([]);

    await init('/repo/doc/adr');
    expect(fs.mkdir).toHaveBeenCalledWith('/repo/doc/adr', { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(path.join('/repo', '.adr-dir'), path.join('doc', 'adr'));
  });

  it('initializes using default directory when none provided', async () => {
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    vi.mocked(workingDir).mockReturnValue('/repo');
    vi.mocked(newNumber).mockResolvedValue(1);
    vi.mocked(template).mockResolvedValue('DATE\nTITLE\nNUMBER\nSTATUS\n');
    mockReaddir.mockResolvedValueOnce([]);

    await init();
    expect(fs.mkdir).toHaveBeenCalledWith('/repo/doc/adr', { recursive: true });
  });

  it('links adrs with explicit command', async () => {
    vi.mocked(findMatchingFilesFor).mockResolvedValueOnce(['0001-first.md']);
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    vi.mocked(fs.readFile).mockResolvedValue('# ADR\n');
    vi.mocked(getTitleFrom).mockReturnValue('ADR Title');
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Relates to',
      reverseLink: 'Related by',
      matches: ['0002-second.md'],
      original: '2:Relates to:Related by',
      pattern: '2'
    });

    await link('0001-first.md', 'Relates to', '2', 'Related by');
    expect(injectLink).toHaveBeenCalled();
  });

  it('asks for clarification when multiple link sources exist', async () => {
    vi.mocked(findMatchingFilesFor).mockResolvedValueOnce(['0001-first.md', '0001-second.md']);
    vi.mocked(askForClarification).mockResolvedValueOnce('0001-first.md');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    vi.mocked(fs.readFile).mockResolvedValue('# ADR\n');
    vi.mocked(getTitleFrom).mockReturnValue('ADR Title');
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Relates to',
      reverseLink: 'Related by',
      matches: ['0002-second.md'],
      original: '2:Relates to:Related by',
      pattern: '2'
    });

    await link('0001', 'Relates to', '2', 'Related by');
    expect(askForClarification).toHaveBeenCalled();
  });

  it('throws when multiple link matches exist in quiet mode', async () => {
    vi.mocked(findMatchingFilesFor).mockResolvedValueOnce(['0001-first.md', '0001-second.md']);
    await expect(link('0001', 'Relates', '2', 'Related by', { quiet: true })).rejects.toThrow(
      'Multiple files match the search pattern'
    );
  });

  it('throws when multiple link matches exist in quiet mode for newAdr links', async () => {
    vi.mocked(newNumber).mockResolvedValueOnce(2);
    vi.mocked(template).mockResolvedValueOnce('DATE\nTITLE\nNUMBER\nSTATUS\n');
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(getLinkDetails).mockResolvedValueOnce({
      link: 'Relates to',
      reverseLink: 'Related by',
      matches: ['0001-first.md', '0001-second.md'],
      original: '1:Relates to:Related by',
      pattern: '1'
    });

    await expect(newAdr('Next ADR', { links: ['1:Relates to:Related by'], suppressPrompts: true })).rejects.toThrow(
      'Multiple files match the search pattern'
    );
  });

  it('lists adr files only', async () => {
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce(['0001-first.md', 'notes.txt']);
    const result = await listAdrs();
    expect(result).toEqual([path.resolve('/repo/doc/adr', '0001-first.md')]);
  });

  it('lists adr files sorted by number', async () => {
    vi.mocked(getDir).mockResolvedValue('/repo/doc/adr');
    mockReaddir.mockResolvedValueOnce(['0010-ten.md', '0002-two.md', 'notes.txt', '0001-one.md']);
    const result = await listAdrs();
    expect(result).toEqual([
      path.resolve('/repo/doc/adr', '0001-one.md'),
      path.resolve('/repo/doc/adr', '0002-two.md'),
      path.resolve('/repo/doc/adr', '0010-ten.md')
    ]);
  });
});
