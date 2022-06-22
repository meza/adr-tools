import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

export const workingDir = () => process.cwd();

const findTopLevelDir = async (dir: string): Promise<string> => {
  try {
    await fs.access(path.join(dir, '.adr-dir'), constants.F_OK);
    return dir;
  } catch (e) {
    if (dir === '/') {
      throw new Error('No ADR directory config found');
    }
    const newDir = path.join(dir, '..');
    return findTopLevelDir(newDir);
  }
};

export const getDir = async (): Promise<string> => {
  try {
    const configDir = await findTopLevelDir(workingDir());
    const configFile = await fs.readFile(path.join(configDir, '.adr-dir'), 'utf8');
    return path.relative(workingDir(), path.join(configDir, configFile.trim()));
  } catch (e) {
    return path.resolve(path.join(workingDir(), 'doc/adr'));
  }
};
