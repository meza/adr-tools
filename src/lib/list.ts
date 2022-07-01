import fs from 'fs/promises';
import path from 'node:path';
import { getDir } from './config.js';
import { getTitleFrom } from './manipulator.js';
import { filenameDetails } from './matchers.js';

export interface AdrListItem {
  file: string,
  path: string,
  title: string,
  number: string
}

export const getAllADRs = async (): Promise<AdrListItem[]> => {
  const adrDir = await getDir();
  const files = await fs.readdir(adrDir);
  const toc = files.filter((file) => file.match(/^\d{4}-.*\.md$/));

  const titles = toc.map(async (file) => {
    const filePath = path.join(adrDir, file);
    const title = getTitleFrom(await fs.readFile(filePath, 'utf8'));
    const filenameDeets = filenameDetails(file);

    return {
      file: file,
      path: filePath,
      title: title,
      number: filenameDeets.number
    };
  });

  return await Promise.all(titles);
};
