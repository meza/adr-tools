import fs from 'fs/promises';
import { getDir } from './config';

export const newNumber = async () => {
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
};
