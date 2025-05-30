import fs from 'fs/promises';
import { getDir } from './config.js';

export interface LinkDetails {
  pattern: string;
  original: string;
  link: string;
  reverseLink: string;
  matches: string[];
}

export const findMatchingFilesFor = async (pattern: string) => {
  const files = await fs.readdir(await getDir());
  return files.filter((file) => file.includes(pattern));
};

export const getLinkDetails = async (linkString: string, isSupersede: boolean = false): Promise<LinkDetails> => {
  const parts = linkString.split(':');
  const pattern = parts[0];
  let link = 'Supersedes';
  let reverseLink = 'Superseded by';
  if (!isSupersede) {
    link = parts[1];
    reverseLink = parts[2];
  }
  const files = await findMatchingFilesFor(pattern);
  return {
    pattern: pattern,
    original: linkString,
    link: link,
    reverseLink: reverseLink,
    matches: files
  };
};
