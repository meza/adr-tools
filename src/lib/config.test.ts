import fs from 'fs/promises';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
    mkdir: vi.fn()
  }
}));

const setupModule = async (cwd: string) => {
  vi.resetModules();
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  const module = await import('./config.js');
  return module;
};

describe('config', () => {
  beforeEach(() => {
    vi.mocked(fs.access).mockReset();
    vi.mocked(fs.readFile).mockReset();
    vi.mocked(fs.mkdir).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses configured adr directory when .adr-dir exists', async () => {
    const cwd = path.join(path.parse(process.cwd()).root, 'repo');
    const { getDir, workingDir } = await setupModule(cwd);
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    vi.mocked(fs.readFile).mockResolvedValueOnce('doc/adr');

    const dir = await getDir();
    expect(workingDir()).toEqual(cwd);
    expect(dir).toEqual(path.join('doc', 'adr'));
    expect(fs.mkdir).toHaveBeenCalledWith(path.join('doc', 'adr'), { recursive: true });
  });

  it('falls back to doc/adr when no config exists', async () => {
    const cwd = path.join(path.parse(process.cwd()).root, 'repo');
    const { getDir } = await setupModule(cwd);
    vi.mocked(fs.access).mockRejectedValue(new Error('missing'));

    const dir = await getDir();
    expect(dir).toEqual(path.resolve(cwd, 'doc/adr'));
    expect(fs.mkdir).toHaveBeenCalledWith(path.resolve(cwd, 'doc/adr'), { recursive: true });
  });

  it('resolves .adr-dir from a parent directory', async () => {
    const repoRoot = path.join(path.parse(process.cwd()).root, 'repo');
    const cwd = path.join(repoRoot, 'subdir');
    const { getDir } = await setupModule(cwd);
    vi.mocked(fs.access).mockImplementation(async (target) => {
      const targetPath = typeof target === 'string' ? target : target.toString();
      if (targetPath === path.join(repoRoot, '.adr-dir')) {
        return;
      }
      throw new Error('missing');
    });
    vi.mocked(fs.readFile).mockResolvedValueOnce('doc/adr');

    const dir = await getDir();
    expect(dir).toEqual(path.join('..', 'doc/adr'));
  });
});
