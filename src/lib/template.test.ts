import fs from 'fs/promises';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn()
  }
}));

vi.mock('./config.js', () => ({
  getDir: vi.fn()
}));

const mockEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
};

describe('template', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(fs.readFile).mockReset();
    mockEnv('ADR_TEMPLATE', undefined);
  });

  afterEach(() => {
    mockEnv('ADR_TEMPLATE', undefined);
    vi.restoreAllMocks();
  });

  it('uses the explicit template file when provided', async () => {
    const { template } = await import('./template.js');
    vi.mocked(fs.readFile).mockResolvedValueOnce('custom');

    const result = await template('/tmp/custom.md');
    expect(result).toEqual('custom');
    expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/tmp/custom.md'), 'utf8');
  });

  it('uses ADR_TEMPLATE when set', async () => {
    const { template } = await import('./template.js');
    mockEnv('ADR_TEMPLATE', '/tmp/env.md');
    vi.mocked(fs.readFile).mockResolvedValueOnce('env');

    const result = await template();
    expect(result).toEqual('env');
    expect(fs.readFile).toHaveBeenCalledWith(path.resolve('/tmp/env.md'), 'utf8');
  });

  it('uses template from adr directory when available', async () => {
    const { template } = await import('./template.js');
    const { getDir } = await import('./config.js');
    vi.mocked(getDir).mockResolvedValueOnce('/repo/doc/adr');
    vi.mocked(fs.readFile).mockResolvedValueOnce('repo-template');

    const result = await template();
    expect(result).toEqual('repo-template');
    expect(fs.readFile).toHaveBeenCalledWith(path.join('/repo/doc/adr', 'templates/template.md'), 'utf8');
  });

  it('falls back to built-in template when repo template is missing', async () => {
    const { template } = await import('./template.js');
    const { getDir } = await import('./config.js');
    vi.mocked(getDir).mockResolvedValueOnce('/repo/doc/adr');
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('missing')).mockResolvedValueOnce('built-in');

    const result = await template();
    expect(result).toEqual('built-in');
  });
});
