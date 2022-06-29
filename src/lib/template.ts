import fs from 'fs/promises';
import * as path from 'node:path';
import { getDir } from './config.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const template = async (templateFile?: string): Promise<string> => {
  if (templateFile) {
    return await fs.readFile(path.resolve(templateFile), 'utf8');
  }
  if (process.env.ADR_TEMPLATE) {
    return await fs.readFile(path.resolve(process.env.ADR_TEMPLATE), 'utf8');
  }

  try {
    return await fs.readFile(path.join(await getDir(), 'templates/template.md'), 'utf8');
  } catch (e) {
    return await fs.readFile(path.resolve(path.join(__dirname, '../templates/template.md')), 'utf8');
  }
};
