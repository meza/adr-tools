import childProcess, { type SpawnSyncOptionsWithStringEncoding } from 'node:child_process';
import path from 'node:path';

export interface AdrCli {
  run(args: string[], options?: { cwd?: string; env?: Record<string, string | undefined>; timeoutMs?: number }): string;
}

export const createAdrCli = (entrypoint: string): AdrCli => {
  const absoluteEntrypoint = path.resolve(entrypoint);
  const tsxCli = path.resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');

  const run: AdrCli['run'] = (args, options) => {
    const result = childProcess.execFileSync(process.execPath, [tsxCli, absoluteEntrypoint, ...args], {
      cwd: options?.cwd,
      env: { ...process.env, ...options?.env },
      timeout: options?.timeoutMs ?? 20000,
      encoding: 'utf8'
    } satisfies SpawnSyncOptionsWithStringEncoding);

    return result.trimEnd();
  };

  return { run };
};
