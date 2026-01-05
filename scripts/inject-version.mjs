import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const buildVersionSource = (version) => `export const LIB_VERSION = '${version}';\n`;

export const resolveTargetPath = (argv) => {
  const target = argv[2];
  if (!target) {
    throw new Error('Usage: node scripts/inject-version.mjs <output-file>');
  }
  return target;
};

export const writeVersionFile = (target, version) => {
  writeFileSync(resolve(process.cwd(), target), buildVersionSource(version), 'utf8');
};

const readPackageVersion = () =>
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const run = () => {
  try {
    const target = resolveTargetPath(process.argv);
    writeVersionFile(target, readPackageVersion());
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  run();
}
