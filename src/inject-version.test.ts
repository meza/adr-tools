import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error no module types for script import
import { buildVersionSource, resolveTargetPath, writeVersionFile } from '../scripts/inject-version.mjs';

describe('inject-version script helpers', () => {
  it('builds the version export', () => {
    expect(buildVersionSource('1.2.3')).toBe("export const LIB_VERSION = '1.2.3';\n");
  });

  it('requires an output path', () => {
    expect(() => resolveTargetPath(['node', 'scripts/inject-version.mjs'])).toThrow(
      'Usage: node scripts/inject-version.mjs <output-file>'
    );
  });

  it('writes the version file', () => {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'adr-version-'));
    const targetPath = path.join(tmpDir, 'version.ts');

    try {
      writeVersionFile(targetPath, '9.9.9');
      const contents = readFileSync(targetPath, 'utf8');
      expect(contents).toBe("export const LIB_VERSION = '9.9.9';\n");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
