import { describe, expect, it, vi } from 'vitest';
import { chooseOpenPlan } from './adr.js';

describe('chooseOpenPlan', () => {
  it('returns none when open is false', () => {
    expect(chooseOpenPlan({ open: false })).toEqual({ type: 'none' });
  });

  it('treats open-with as enabling open', () => {
    expect(chooseOpenPlan({ openWith: 'code --wait' })).toEqual({
      type: 'app',
      name: 'code',
      args: ['--wait']
    });
  });

  it('falls back to default when EDITOR is npm injected', () => {
    vi.stubEnv('npm_execpath', '/usr/bin/npm');
    vi.stubEnv('npm_config_editor', 'vi');
    vi.stubEnv('EDITOR', 'vi');
    vi.stubEnv('VISUAL', '');

    expect(chooseOpenPlan({ open: true })).toEqual({ type: 'default' });
  });
});
