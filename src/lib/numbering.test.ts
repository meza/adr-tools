import { afterAll, describe, it, vi, expect } from 'vitest';
import fs from 'fs/promises';
import { newNumber } from './numbering';

type ReaddirMock = () => Promise<String[]>

vi.mock('fs/promises');
vi.mock('./config', () => ({
  getDir: vi.fn().mockResolvedValue('/')
}));

describe('The numbering logic', () => {

  afterAll(() => {
    vi.resetAllMocks();
  });
  it('can read from the sequence file', async () => {
    const random = Math.floor(Math.random() * 100);
    vi.mocked(fs.readFile).mockResolvedValueOnce(random.toString());
    const num = await newNumber();
    expect(num).toEqual(random + 1);
  });

  it('returns 1 if there are no files', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce('no sequence file');
    vi.mocked(fs.readdir).mockResolvedValueOnce([]);
    const num = await newNumber();
    expect(num).toEqual(1);
  });

  it('processes existing files if there is no lockfile', async () => {
    const fakeFiles: string[] = [
      '0001-first-file.md',
      '0002-first-file.md'
    ];
    vi.mocked(fs.readFile).mockRejectedValueOnce('no sequence file');
    vi.mocked(fs.readdir as unknown as ReaddirMock).mockResolvedValueOnce(fakeFiles);
    const num = await newNumber();
    expect(num).toEqual(3);
  });
});
