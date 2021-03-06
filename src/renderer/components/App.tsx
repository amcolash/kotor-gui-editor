import { detailedDiff } from 'deep-object-diff';
import { remote } from 'electron';
import { bindGlobal } from 'mousetrap';
import 'mousetrap-global-bind';
import { join, resolve } from 'path';
import React from 'react';
import { Book, Moon, Sun, Terminal } from 'react-feather';
import { cssRule } from 'typestyle';
import { makeMenu } from '../../main/menu';
import {
  darkBackground,
  darkBackgroundInput,
  darkColor,
  darkOutlineInput,
  iconSize,
  isDevelopment,
  lightBackground,
  lightColor,
  os,
} from '../util/Consts';
import { clone, findModifiedNode, getPath } from '../util/DataUtil';
import { extractPng, loadGff, saveGff } from '../util/XoreosTools';
import Button from './Button';
import FilePicker from './FilePicker';
import License from './License';
import Preview from './Preview';
import PropertyList from './PropertyList';
import Tree from './Tree';

cssRule('body', {
  margin: 0,
  overflow: 'hidden',
  fontFamily: 'sans-serif',
});

// cssRule('input', {
//   backgroundColor: lightBackgroundInput,
// });

cssRule('.darkMode input', {
  backgroundColor: darkBackgroundInput,
  border: `1px solid ${darkOutlineInput}`,
});

cssRule('::-webkit-scrollbar', {
  backgroundColor: '#e0e0e0',
  margin: 4,
});

cssRule('::-webkit-scrollbar-thumb', {
  backgroundColor: '#ccc',
});

cssRule('.darkMode ::-webkit-scrollbar', {
  backgroundColor: '#ccc',
  border: '1px solid #aaa',
});

cssRule('.darkMode ::-webkit-scrollbar-thumb', {
  backgroundColor: '#e7e7e7',
});

export interface AppState {
  data: GFF;
  history: GFF[];
  historyIndex: number;
  lastUpdated: string;
  darkMode: boolean;
  license: boolean;
  tgaPath?: string;
  guiFile?: string;
  selected?: Struct;
  extracting?: string;
}

export const tmpDir = join(remote.app.getPath('temp'), 'kotor-gui');
export const electronRoot = resolve(remote.app.getAppPath(), '../../'); // Both in prod and in dev, this seems to be the right path (maybe not on mac)
export const toolsPath = join(electronRoot, `xoreos-tools/xoreos-tools-0.0.6-${os}64/`);

console.log('using tool path', toolsPath);

export default class App extends React.Component<{}, AppState> {
  state: AppState = {
    data: { gff3: { struct: [], type: 'unknown' } },
    history: [],
    historyIndex: 1,
    lastUpdated: '',
    darkMode: localStorage.getItem('darkMode') === 'true' || false,
    license: false,
    tgaPath: localStorage.getItem('tgaPath') || undefined,
    guiFile: localStorage.getItem('guiFile') || undefined,
  };

  public componentDidMount() {
    // Note: ASAR path only works in prod
    const packageDir = isDevelopment ? resolve(electronRoot) : resolve(__dirname);
    const menu = makeMenu(electronRoot, packageDir, this.changeHistory);
    remote.Menu.setApplicationMenu(menu);

    this.load();

    window.onerror = this.handleError;

    // Override undo/redo in text boxes
    bindGlobal('mod+z', () => {
      this.changeHistory(1);
      return false;
    });
    bindGlobal(['mod+y', 'shift+mod+z'], () => {
      this.changeHistory(-1);
      return false;
    });
  }

  private handleError(e: any) {
    console.error(e);
    remote.dialog.showMessageBoxSync({ message: JSON.stringify(e), type: 'error', buttons: ['Ok'] });
  }

  private extract(clear?: boolean) {
    if (!this.state.tgaPath) return;

    extractPng(
      this.state.tgaPath,
      toolsPath,
      this.state.data,
      (s: Partial<AppState>) => this.setState(s as AppState),
      this.handleError,
      clear
    );
  }

  private load() {
    if (!this.state.guiFile) return;

    loadGff(
      this.state.guiFile,
      toolsPath,
      (s: Partial<AppState>) => {
        this.setState(s as AppState, () => {
          console.log('data', s.data);
          this.extract();
        });
      },
      this.handleError
    );
  }

  private updateData = (d?: GFF, cb?: () => void) => {
    const data = d || this.state.data;

    let history = [...this.state.history, clone(this.state.data)];

    // Determine if we need to update the last history item or make a new entry (so things like rename won't blow up history stack)
    const diff: any = detailedDiff(this.state.history[this.state.history.length - this.state.historyIndex], data);
    const wasAdded = Object.keys(diff.added).length > 0;
    const wasDeleted = Object.keys(diff.deleted).length > 0;
    const wasUpdated = Object.keys(diff.updated).length > 0;

    let lastUpdated = '';
    // Check only if something was updated, not 100% perfect but decent most of the time
    if (wasUpdated && !wasAdded && !wasDeleted) {
      try {
        // console.log(diff.updated);
        lastUpdated = getPath(diff.updated);

        // Rewrite the last history entry w/ new data
        if (this.state.lastUpdated === lastUpdated) {
          history = [...this.state.history.slice(0, this.state.history.length - 1), clone(this.state.data)];
        }
      } catch (e) {
        // Multiple things were changed, don't do anything special
      }
    }

    // Slice out history that will not be able to be re-done
    if (this.state.historyIndex > 1) {
      history = [...history.slice(0, this.state.history.length - this.state.historyIndex + 1), clone(data)];
    }

    // Cap undo stack to 50 just in case for now...
    const maxUndoSize = 50;
    if (history.length > maxUndoSize - 1) history = history.slice(history.length - maxUndoSize);

    this.setState({ data, history, historyIndex: 1, lastUpdated }, () => {
      if (cb) cb();
    });
  };

  // Careful! Rewriting the past can lead to all kinds of wrinkles in the fabric of time
  private changeHistory = (dir: number) => {
    const historyIndex = this.state.historyIndex + dir;
    if (historyIndex > 0 && this.state.history.length >= historyIndex) {
      const data = clone(this.state.history[this.state.history.length - historyIndex]);

      // Try to select the new matching (and previously selected) item from the cloned history data tree
      const selected = findModifiedNode(this.state.data, data);

      this.setState({ data, historyIndex, selected });
    }
  };

  public render() {
    const background = this.state.darkMode ? darkBackground : lightBackground;
    const color = this.state.darkMode ? darkColor : lightColor;

    if (this.state.extracting) {
      return (
        <div
          style={{
            color,
            background,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: this.state.darkMode ? 'invert(1)' : undefined,
          }}
        >
          <h2>Extracting PNGs from TGAs, please wait... {this.state.extracting}</h2>
        </div>
      );
    }

    return (
      <div
        className={'mainContainer' + (this.state.darkMode ? ' darkMode' : '')}
        style={{
          color,
          background,
          padding: 5,
          width: 'calc(100vw - 10px)',
          height: 'calc(100vh - 10px)',
          display: 'flex',
          flexDirection: 'column',
          filter: this.state.darkMode ? 'invert(1)' : undefined,
        }}
      >
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
            <FilePicker
              label="UI Image Path"
              file={this.state.tgaPath}
              filter="directory"
              updateFile={(file) => {
                this.setState({ tgaPath: file }, () => {
                  localStorage.setItem('tgaPath', file);
                  this.extract(true);
                });
              }}
              style={{ flex: 1 }}
              darkMode={this.state.darkMode}
            />
            <Button onClick={() => this.extract(true)} title="Reload all images">
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
                  this.load();
                });
              }}
              style={{ flex: 1 }}
              darkMode={this.state.darkMode}
            />
            <Button onClick={() => this.load()} title="Revert all unsaved changes">
              Revert
            </Button>
            <Button onClick={() => saveGff(this.state.guiFile!, toolsPath, this.state.data, this.handleError)} title="Save .gui file">
              Save
            </Button>

            <Button
              onClick={(e) => {
                localStorage.setItem('darkMode', JSON.stringify(!this.state.darkMode));
                this.setState({ darkMode: !this.state.darkMode });
              }}
              style={{ marginLeft: 10, background: this.state.darkMode ? '#181818' : '#333' }}
              title="Dark Mode"
            >
              {this.state.darkMode ? (
                <Sun size={iconSize} style={{ marginBottom: -3, color: '#1090d6' }} />
              ) : (
                <Moon size={iconSize} style={{ marginBottom: -3, color: '#dbbc32' }} />
              )}
            </Button>

            <Button
              onClick={(e) => remote.getCurrentWindow().webContents.toggleDevTools()}
              style={{ marginLeft: 10, background: this.state.darkMode ? '#ddd' : '#333' }}
              title="Debugging Tools"
            >
              <Terminal size={iconSize} style={{ marginBottom: -3, color: this.state.darkMode ? '#333' : '#eee' }} />
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: 8 }}>
          <Tree
            data={this.state.data}
            selected={this.state.selected}
            updateSelected={(selected?: Struct) => this.setState({ selected })}
            darkMode={this.state.darkMode}
          />
          {/* Easier to make borders this way than fight with annoying edges of things */}
          {this.state.data && <div style={{ borderRight: '1px solid #999', padding: 6 }} />}
          <Preview
            data={this.state.data}
            selected={this.state.selected}
            updateSelected={(selected?: Struct) => this.setState({ selected })}
            updateData={this.updateData}
            darkMode={this.state.darkMode}
          />
          {this.state.data && <div style={{ borderLeft: '1px solid #999' }} />}
          <PropertyList selected={this.state.selected} updateData={this.updateData} darkMode={this.state.darkMode} />
        </div>
        <div style={{ display: 'flex' }}>
          {isDevelopment && (
            <div>
              <span style={{ verticalAlign: 'sub' }}>
                History Size: {this.state.history.length}, History Index; {this.state.historyIndex}, Last Modified Node:{' '}
                {this.state.lastUpdated}
              </span>
            </div>
          )}
          <div style={{ flex: 1 }}></div>
          <Button onClick={(e) => this.setState({ license: !this.state.license })} style={{ margin: 0 }} title="3rd Party Licenses">
            <Book size={iconSize} style={{ marginBottom: -3 }} />
          </Button>
        </div>
        {this.state.license && <License close={() => this.setState({ license: false })} />}
      </div>
    );
  }
}
