import fs from 'fs/promises';
import path from 'path';

export const workingDir = () => process.cwd();

export const getDir = async (): Promise<string> => {

  try {
    const configFile = await fs.readFile(path.join(workingDir(), '.adr-dir'), 'utf8');
    return path.resolve(configFile.trim());
  } catch (e) {
    return path.resolve(path.join(workingDir(), 'doc/adr'));
  }
};
