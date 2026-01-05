import { describe, expect, it, vi } from 'vitest';

vi.mock('marked', () => ({
  marked: {
    lexer: () => [
      {
        type: 'paragraph',
        text: {
          toString: () => 'Superseded by [1. title](0001-title.md)',
          match: () => null
        }
      }
    ]
  }
}));

describe('The ADR manipulator error cases', () => {
  it('throws when a link cannot be parsed', async () => {
    const { getLinksFrom } = await import('./manipulator.js');
    expect(() => getLinksFrom('ignored')).toThrowError('Could not parse link from');
  });
});
