import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { getDir } from './config.js';
import { getAllADRs } from './list.js';
import { getTitleFrom } from './manipulator.js';
type ReaddirMock = () => Promise<String[]>
vi.mock('./config.js');
vi.mock('fs/promises');
vi.mock('./manipulator.js');

describe('The list helper', () => {
  beforeEach(() => {
    vi.mocked(getDir).mockResolvedValue('/');
    vi.mocked(getTitleFrom).mockReturnValue('mocked-title');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns an empty list when no ADRs are found', async () => {
    vi.mocked(fs.readdir).mockResolvedValueOnce([]);
    const adrs = await getAllADRs();
    expect(adrs).toEqual([]);
  });

  it('can filter out the valid ADRs', async () => {
    vi.mocked(fs.readdir as unknown as ReaddirMock).mockResolvedValueOnce([
      'hello',
      'something.md',
      '0002.md',
      '0005-hello.md',
      '003-not-long-enough.md',
      '0004-just-perfect.md'
    ]);
    const adrs = await getAllADRs();
    expect(adrs).toHaveLength(2);
  });

  it('returns the correct data', async () => {
    vi.mocked(fs.readdir as unknown as ReaddirMock).mockResolvedValueOnce([
      'hello',
      'something.md',
      '0002.md',
      '0005-hello.md',
      '003-not-long-enough.md',
      '0004-just-perfect.md'
    ]);
    const adrs = await getAllADRs();
    expect(adrs[0]).toEqual({
      file: '0005-hello.md',
      path: '/0005-hello.md',
      title: 'mocked-title',
      number: '5'
    });

    expect(adrs[1]).toEqual({
      file: '0004-just-perfect.md',
      path: '/0004-just-perfect.md',
      title: 'mocked-title',
      number: '4'
    });
  });
});
