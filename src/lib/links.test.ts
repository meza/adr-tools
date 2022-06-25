import { vi, describe, it, expect, afterEach } from 'vitest';
import fs from 'fs/promises';
import { getDir } from './config';
import { getLinkDetails } from './links';

vi.mock('./config');
vi.mock('fs/promises');

describe('The link lib', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('does not care if there are no matches', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/');
    vi.mocked(fs.readdir).mockResolvedValueOnce([] as any);
    const linkString = '1:overrides:overriden by';
    const response = await getLinkDetails(linkString);
    expect(response).toEqual({
      pattern: '1',
      original: '1:overrides:overriden by',
      link: 'overrides',
      reverseLink: 'overriden by',
      matches: []
    });
  });

  it('does handles multiple matches', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/');
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      '1-one',
      '1-two',
      '1-three'
    ] as any);
    const linkString = '1:overrides:overriden by';
    const response = await getLinkDetails(linkString);
    expect(response).toEqual({
      pattern: '1',
      original: '1:overrides:overriden by',
      link: 'overrides',
      reverseLink: 'overriden by',
      matches: [
        '1-one',
        '1-two',
        '1-three'
      ]
    });
  });

  it('returns only files that match the pattern', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/');
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      'on1e',
      '1-two',
      'three'
    ] as any);
    const linkString = '1:overrides:overriden by';
    const response = await getLinkDetails(linkString);
    expect(response).toEqual({
      pattern: '1',
      original: '1:overrides:overriden by',
      link: 'overrides',
      reverseLink: 'overriden by',
      matches: [
        'on1e',
        '1-two'
      ]
    });
  });

  it('handles superseding', async () => {
    vi.mocked(getDir).mockResolvedValueOnce('/');
    vi.mocked(fs.readdir).mockResolvedValueOnce([] as any);
    const linkString = '1';
    const supersede = true;
    const response = await getLinkDetails(linkString, supersede);
    expect(response).toEqual({
      pattern: '1',
      original: '1',
      link: 'Supersedes',
      reverseLink: 'Superseded by',
      matches: []
    });
  });

});
