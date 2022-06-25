import fs from 'fs/promises';
import { getDir } from './config';
import * as path from 'path';

export const newNumber = async () => {
  try {
    const lockfile = await fs.readFile(path.resolve(await getDir(), '.adr-sequence.lock'));
    return parseInt(lockfile.toString().trim(), 10) + 1;
  } catch (e) {
    // This is for backward compatibility. If someone upgrades from an older tool without a lockfile,
    // we create one.
    const filePattern = /^0*(\d+)-.*$/;
    const files = await fs.readdir(await getDir());
    const numbers = files.map(f => {
      const adrFile = f.match(filePattern);
      if (adrFile) {
        return parseInt(adrFile[1], 10);
      }
      return 0;
    });

    const largestNumber = numbers.reduce((a, b) => Math.max(a, b), 0);
    return largestNumber + 1;
  }

};
