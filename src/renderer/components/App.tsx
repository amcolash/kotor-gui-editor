import { exec } from 'child_process';
import * as commandExists from 'command-exists';
import { detailedDiff } from 'deep-object-diff';
import { remote } from 'electron';
import * as escape from 'escape-path-with-spaces';
import { exists, existsSync, readFile, writeFile } from 'fs';
import { emptyDir, mkdirp } from 'fs-extra';
import { bind, bindGlobal } from 'mousetrap';
import 'mousetrap-global-bind';
import { platform } from 'os';
import { basename, join, resolve } from 'path';
import React from 'react';
import { Terminal } from 'react-feather';
import tga2png from 'tga2png';
import { cssRule } from 'typestyle';
import { promisify } from 'util';
import { toJson, toXml } from 'xml2json';
import Button from './Button';
import FilePicker from './FilePicker';
import Preview from './Preview';
import PropertyList from './PropertyList';
import Tree from './Tree';

cssRule('body', {
  margin: 0,
  overflow: 'hidden',
  background: 'white',
  fontFamily: 'sans-serif',
});

interface AppState {
  data: any;
  history: any[];
  historyIndex: number;
  lastUpdated: string;
  tgaPath?: string;
  guiFile?: string;
  selected?: any;
  extracting?: string;
}

export const emptyDirAsync = promisify(emptyDir);
export const execAsync = promisify(exec);
export const existsAsync = promisify(exists);
export const mkdirpAsync = promisify(mkdirp);
export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);

export const tmpDir = join(remote.app.getPath('temp'), 'kotor-gui');
const os = platform().replace('-32', '').replace('darwin', 'mac');
const root = resolve(remote.app.getAppPath(), '../../'); // Both in prod and in dev, this seems to be the right path (maybe not on mac)
const toolsPath = escape(join(root, `xoreos-tools/xoreos-tools-0.0.6-${os}64/`));

console.log('using tool path', toolsPath);

export default class App extends React.Component<{}, AppState> {
  state: AppState = {
    data: '',
    history: [],
    historyIndex: 1,
    lastUpdated: '',
    tgaPath: localStorage.getItem('tgaPath') || undefined,
    guiFile: localStorage.getItem('guiFile') || undefined,
  };

  // TODO: Only for dev
  public componentDidMount() {
    this.loadGff();

    window.onerror = this.handleError;

    bind(['ctrl+shift+i', 'command+option+i'], () => remote.getCurrentWindow().webContents.toggleDevTools());
    bind(['mod+r', 'shift+mod+r'], () => remote.getCurrentWindow().reload());

    // Override undo/redo in text boxes
    bindGlobal('mod+z', () => {
      this.undo();
      return false;
    });
    bindGlobal(['mod+y', 'shift+mod+z'], () => {
      this.redo();
      return false;
    });
  }

  private handleError(e: any) {
    console.error(e);
    remote.dialog.showMessageBoxSync({ message: JSON.stringify(e), type: 'error', buttons: ['Ok'] });
  }

  private clone(d: any) {
    return JSON.parse(JSON.stringify(d));
  }

  private commandInPath = async (command: string): Promise<boolean> => {
    try {
      await commandExists(command);
      return true;
    } catch (e) {
      // Command does not exist
      return false;
    }
  };

  private extractPng = async (clear?: boolean) => {
    if (this.state.tgaPath && this.state.data) {
      try {
        this.setState({ extracting: '' });

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

        const root = this.state.data.gff3.struct[0];
        checkNode(root);

        const items = Array.from(imageSet);
        // console.log('extracting images:', items);

        const resolvedTgaPath = resolve(this.state.tgaPath);

        const destDir = join(tmpDir, 'png');
        await mkdirpAsync(destDir);

        const tgaTmpDir = join(tmpDir, 'tga');
        await mkdirpAsync(tgaTmpDir);

        if (clear) {
          await emptyDirAsync(destDir);
          await emptyDirAsync(tgaTmpDir);
        }

        for (let i = 0; i < items.length; i++) {
          this.setState({ extracting: `(${i + 1}/${items.length})` });

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
              const inPath = await this.commandInPath(command);
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

        this.setState({ extracting: undefined });
      } catch (e) {
        this.handleError(e);
      }
    }
  };

  private loadGff = async () => {
    if (this.state.guiFile && existsSync(this.state.guiFile)) {
      let data;

      try {
        const command = 'gff2xml' + (platform() === 'win32' ? '.exe' : '');
        const inPath = await this.commandInPath(command);
        const resolvedTool = inPath ? command : resolve(toolsPath, command);
        const resolvedGui = resolve(this.state.guiFile!);
        const resolvedXml = resolve(tmpDir, basename(this.state.guiFile! + '-loaded.xml'));

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
        this.handleError(e);
      }

      // Keep this block outside of the try/catch so that it is handled properly elsewhere
      if (data) {
        this.setState(
          { data: this.clone(data), history: [this.clone(data)], historyIndex: 1, lastUpdated: '', selected: undefined },
          () => {
            console.log('data', this.state.data);
            this.extractPng();
          }
        );
      }
    }
  };

  private saveGff = async () => {
    if (this.state.guiFile && existsSync(this.state.guiFile)) {
      try {
        const command = 'xml2gff' + (platform() === 'win32' ? '.exe' : '');
        const inPath = await this.commandInPath(command);
        const resolvedTool = inPath ? command : resolve(toolsPath, command);
        const resolvedXml = resolve(tmpDir, basename(this.state.guiFile! + '-saved.xml'));
        const resolvedGui = resolve(this.state.guiFile! + '-new.gui');

        const xml = toXml(this.state.data);
        await writeFileAsync(resolvedXml, xml);

        const args = ['--kotor', escape(resolvedXml), escape(resolvedGui)];
        const { stdout, stderr } = await execAsync(`${resolvedTool} ${args.join(' ')}`);

        if (stdout) console.log(stdout);
        if (stderr) throw stderr;
      } catch (e) {
        this.handleError(e);
      }
    }
  };

  // Generate a path string (only works if there is a singular item at the bottom of the tree)
  private getPath(diff: any): string {
    if (typeof diff !== 'object') return diff;

    const keys = Object.keys(diff);
    if (keys.length === 0) {
      return '';
    } else if (keys.length === 1) {
      if (typeof diff[keys[0]] !== 'object') {
        return keys[0];
      }

      return keys[0] + '.' + this.getPath(diff[keys[0]]);
    }

    throw 'Multiple changes';
  }

  private updateData = (data: any, cb?: () => void) => {
    let history = [...this.state.history, this.clone(this.state.data)];

    // Determine if we need to update the last history item or make a new entry (so things like rename won't blow up history stack)
    const diff: any = detailedDiff(this.state.history[this.state.history.length - 1], data);
    const wasAdded = Object.keys(diff.added).length > 0;
    const wasDeleted = Object.keys(diff.deleted).length > 0;
    const wasUpdated = Object.keys(diff.updated).length > 0;

    let lastUpdated = '';
    // Check only if something was updated
    if (wasUpdated && !wasAdded && !wasDeleted) {
      try {
        lastUpdated = this.getPath(diff.updated);

        // Rewrite the last history entry w/ new data
        if (this.state.lastUpdated === lastUpdated) {
          history = [...this.state.history.slice(0, this.state.history.length - 1), this.clone(this.state.data)];
        }
      } catch (e) {
        // Multiple things were changed, don't do anything special
      }
    }

    // Slice out history that will not be able to be re-done
    if (this.state.historyIndex > 1) {
      history = [...history.slice(0, this.state.history.length - this.state.historyIndex + 1), this.clone(data)];
    }

    // Cap undo stack to 50 just in case for now...
    const maxUndoSize = 50;
    if (history.length > maxUndoSize - 1) history = history.slice(history.length - maxUndoSize);

    this.setState({ data, history, historyIndex: 1, lastUpdated }, () => {
      if (cb) cb();
    });
  };

  private undo() {
    console.log('undo');

    const historyIndex = this.state.historyIndex + 1;
    if (this.state.history.length >= historyIndex) {
      this.setState({
        data: this.clone(this.state.history[this.state.history.length - historyIndex]),
        historyIndex,
      });
    }
  }

  private redo() {
    const historyIndex = this.state.historyIndex - 1;
    if (historyIndex > 0) {
      this.setState({
        data: this.clone(this.state.history[this.state.history.length - historyIndex]),
        historyIndex,
      });
    }
  }

  public render() {
    if (this.state.extracting) {
      return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h2>Extracting PNGs from TGAs, please wait... {this.state.extracting}</h2>
        </div>
      );
    }

    return (
      <div
        className="mainContainer"
        style={{
          padding: 5,
          width: 'calc(100vw - 10px)',
          height: 'calc(100vh - 10px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex' }}>
          History: {this.state.history.length}, Index:{this.state.historyIndex}, Last Updated: {this.state.lastUpdated}
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
            <FilePicker
              label="TGA Path"
              file={this.state.tgaPath}
              filter="directory"
              updateFile={(file) => {
                this.setState({ tgaPath: file }, () => {
                  localStorage.setItem('tgaPath', file);
                  this.extractPng(true);
                });
              }}
              style={{ flex: 1 }}
            />
            <Button onClick={() => this.extractPng(true)} title="Reload all images">
              Reload Images
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
            <FilePicker
              label="GUI File"
              file={this.state.guiFile}
              filter="gui"
              updateFile={(file) => {
                this.setState({ guiFile: file }, () => {
                  localStorage.setItem('guiFile', file);
                  this.loadGff();
                });
              }}
              style={{ flex: 1 }}
            />
            <Button onClick={this.loadGff} title="Revert all unsaved changes">
              Revert
            </Button>
            <Button onClick={this.saveGff} title="Save .gui file">
              Save
            </Button>

            <Button
              onClick={(e) => remote.getCurrentWindow().webContents.toggleDevTools()}
              style={{ marginLeft: 10, background: '#333' }}
              title="Debugging Tools"
            >
              <Terminal size="16" style={{ marginBottom: -3, color: '#eee' }} />
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: 8 }}>
          <Tree data={this.state.data} selected={this.state.selected} updateSelected={(selected: any) => this.setState({ selected })} />
          <Preview
            data={this.state.data}
            selected={this.state.selected}
            updateSelected={(selected: any) => this.setState({ selected })}
            updateData={this.updateData}
          />
          <PropertyList data={this.state.data} selected={this.state.selected} updateData={this.updateData} />
        </div>
      </div>
    );
  }
}
