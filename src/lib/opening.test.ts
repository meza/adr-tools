import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseOpenPlan } from './adr.js';

describe('chooseOpenPlan', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
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

  it('parses quoted arguments', () => {
    expect(chooseOpenPlan({ openWith: 'code "arg with space"' })).toEqual({
      type: 'app',
      name: 'code',
      args: ['arg with space']
    });
  });

  it('unescapes quoted arguments', () => {
    expect(chooseOpenPlan({ openWith: 'code "arg \\"quoted\\""' })).toEqual({
      type: 'app',
      name: 'code',
      args: ['arg "quoted"']
    });
  });

  it('parses single-quoted arguments', () => {
    expect(chooseOpenPlan({ openWith: "code 'arg with space'" })).toEqual({
      type: 'app',
      name: 'code',
      args: ['arg with space']
    });
  });

  it('returns none when open-with is not parseable', () => {
    expect(chooseOpenPlan({ openWith: '"' })).toEqual({ type: 'none' });
  });

  it('returns none when open-with is whitespace', () => {
    expect(chooseOpenPlan({ openWith: '   ' })).toEqual({ type: 'none' });
  });

  it('returns none when open-with is only quoted whitespace', () => {
    expect(chooseOpenPlan({ openWith: '"   "' })).toEqual({ type: 'none' });
  });

  it('handles quoted empty command', () => {
    expect(chooseOpenPlan({ openWith: '""', open: true })).toEqual({ type: 'default' });
  });

  it('ignores boolean-like editor values', () => {
    vi.stubEnv('VISUAL', 'true');
    vi.stubEnv('EDITOR', 'false');
    expect(chooseOpenPlan({ open: true })).toEqual({ type: 'default' });
  });

  it('prefers VISUAL over EDITOR when both are set', () => {
    vi.stubEnv('VISUAL', 'code');
    vi.stubEnv('EDITOR', 'vim');
    expect(chooseOpenPlan({ open: true })).toEqual({ type: 'app', name: 'code', args: [] });
  });

  it('uses EDITOR when it is not npm injected', () => {
    vi.stubEnv('EDITOR', 'vim');
    vi.stubEnv('npm_execpath', '');
    vi.stubEnv('npm_config_editor', '');
    expect(chooseOpenPlan({ open: true })).toEqual({ type: 'app', name: 'vim', args: [] });
  });

  it('falls back to default when EDITOR is npm injected', () => {
    vi.stubEnv('npm_execpath', '/usr/bin/npm');
    vi.stubEnv('npm_config_editor', 'vi');
    vi.stubEnv('EDITOR', 'vi');
    vi.stubEnv('VISUAL', '');

    expect(chooseOpenPlan({ open: true })).toEqual({ type: 'default' });
  });

  it('uses EDITOR when npm_config_editor is different', () => {
    vi.stubEnv('npm_execpath', '/usr/bin/npm');
    vi.stubEnv('npm_config_editor', 'code');
    vi.stubEnv('EDITOR', 'vim');
    vi.stubEnv('VISUAL', '');

    expect(chooseOpenPlan({ open: true })).toEqual({ type: 'app', name: 'vim', args: [] });
  });
});
