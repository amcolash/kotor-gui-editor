import { existsSync } from 'original-fs';
import { platform } from 'os';
import { basename, join, resolve } from 'path';
import * as tga2png from 'tga2png';
import { toJson, toXml } from 'xml2json';
import { AppState, tmpDir } from '../renderer/components/App';
import { copyFileAsync, emptyDirAsync, execAsync, existsAsync, mkdirpAsync, readFileAsync, writeFileAsync } from './Async';
import { clone, commandInPath } from './DataUtil';

export async function extractPng(
  tgaPath: string,
  toolsPath: string,
  data: any,
  setState: (state: Partial<AppState>) => void,
  handleError: (e: any) => void,
  clear?: boolean
) {
  if (tgaPath && data) {
    try {
      setState({ extracting: '' });

      const imageSet: Set<string> = new Set();

      const checkNode = (data: any) => {
        if (data.struct) {
          data.struct.forEach((s: any) => {
            if (s.label === 'BORDER') {
              let showImg = false;
              s.sint32.forEach((s: any) => {
                if (s.label === 'FILLSTYLE' && s.$t === '2') showImg = true;
              });

              if (showImg) {
                s.resref.forEach((s: any) => {
                  if (s.label === 'FILL' && s.$t) imageSet.add(s.$t);
                });
              }
            }
          });
        }

        if (data.list?.struct) {
          data.list.struct.forEach((s: any) => {
            checkNode(s);
          });
        }
      };

      const root = data.gff3.struct[0];
      checkNode(root);

      const items = Array.from(imageSet);
      // console.log('extracting images:', items);

      const resolvedTgaPath = resolve(tgaPath);

      const destDir = join(tmpDir, 'png');
      await mkdirpAsync(destDir);

      const tgaTmpDir = join(tmpDir, 'tga');
      await mkdirpAsync(tgaTmpDir);

      if (clear) {
        await emptyDirAsync(destDir);
        await emptyDirAsync(tgaTmpDir);
      }

      for (let i = 0; i < items.length; i++) {
        setState({ extracting: `(${i + 1}/${items.length})` });

        const tgaPath = join(resolvedTgaPath, items[i] + '.tga');
        const tpcPath = join(resolvedTgaPath, items[i] + '.tpc');

        const dest = join(destDir, items[i] + '.png');

        if (!(await existsAsync(dest))) {
          if (await existsAsync(tgaPath)) {
            // TGA EXTRACTION
            await tga2png(tgaPath, dest);
          } else if (await existsAsync(tpcPath)) {
            // TPC EXTRACTION
            const command = 'xoreostex2tga' + (platform() === 'win32' ? '.exe' : '');
            const inPath = await commandInPath(command);
            const resolvedTool = inPath ? command : resolve(toolsPath, command);
            const extractedTga = join(tgaTmpDir, items[i] + '.tga');

            const args = [escape(tpcPath), escape(extractedTga)];
            const { stdout, stderr } = await execAsync(`${resolvedTool} ${args.join(' ')}`);

            if (stdout) console.log(stdout);
            if (stderr) {
              throw stderr;
            }

            await tga2png(extractedTga, dest);
          } else {
            console.log('no image found for', items[i]);
          }
        }
      }

      setState({ extracting: undefined });
    } catch (e) {
      handleError(e);
    }
  }
}

export async function loadGff(
  guiFile: string,
  toolsPath: string,
  setState: (state: Partial<AppState>) => void,
  handleError: (e: any) => void
) {
  if (guiFile && existsSync(guiFile)) {
    let data: any;

    try {
      const command = 'gff2xml' + (platform() === 'win32' ? '.exe' : '');
      const inPath = await commandInPath(command);
      const resolvedTool = inPath ? command : resolve(toolsPath, command);
      const resolvedGui = resolve(guiFile!);
      const resolvedXml = resolve(tmpDir, basename(guiFile! + '-loaded.xml'));

      const args = ['--kotor', escape(resolvedGui), escape(resolvedXml)];
      const { stdout, stderr } = await execAsync(`${resolvedTool} ${args.join(' ')}`);

      if (stdout) console.log(stdout);
      if (stderr) {
        if (stderr.trim() !== `Converted "${resolvedGui}" to "${resolvedXml}"`) {
          throw stderr;
        }
      }

      const xml = await readFileAsync(resolvedXml);

      data = toJson(xml, {
        object: true,
        reversible: true,
        sanitize: true,
        trim: true,
        arrayNotation: ['sint32', 'byte', 'exostring', 'struct', 'vector', 'resref'],
      });
    } catch (e) {
      handleError(e);
    }

    // Keep this block outside of the try/catch so that it is handled properly elsewhere
    if (data) {
      setState({ data: clone(data), history: [clone(data)], historyIndex: 1, lastUpdated: '', selected: undefined });
    }
  }
}

export async function saveGff(guiFile: string, toolsPath: string, data: any, handleError: (e: any) => void) {
  if (guiFile && (await existsAsync(guiFile))) {
    try {
      const command = 'xml2gff' + (platform() === 'win32' ? '.exe' : '');
      const inPath = await commandInPath(command);
      const resolvedTool = inPath ? command : resolve(toolsPath, command);
      const resolvedXml = resolve(tmpDir, basename(guiFile + '-saved.xml'));
      const resolvedGui = resolve(guiFile);
      const resolvedBackupGui = resolve(guiFile + '.bak');

      await copyFileAsync(resolvedGui, resolvedBackupGui);

      const xml = toXml(data);
      await writeFileAsync(resolvedXml, xml);

      const args = ['--kotor', escape(resolvedXml), escape(resolvedGui)];
      const { stdout, stderr } = await execAsync(`${resolvedTool} ${args.join(' ')}`);

      if (stdout) console.log(stdout);
      if (stderr) throw stderr;
    } catch (e) {
      handleError(e);
    }
  }
}
