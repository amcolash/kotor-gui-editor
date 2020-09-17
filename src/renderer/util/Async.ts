import { exec } from 'child_process';
import { copyFile, exists, readFile, writeFile } from 'fs';
import { emptyDir, mkdirp } from 'fs-extra';
import { promisify } from 'util';

export const copyFileAsync = promisify(copyFile);
export const emptyDirAsync = promisify(emptyDir);
export const execAsync = promisify(exec);
export const existsAsync = promisify(exists);
export const mkdirpAsync = promisify(mkdirp);
export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);
