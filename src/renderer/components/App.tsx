import { detailedDiff } from 'deep-object-diff';
import { remote } from 'electron';
import * as escape from 'escape-path-with-spaces';
import { bind, bindGlobal } from 'mousetrap';
import 'mousetrap-global-bind';
import { platform } from 'os';
import { join, resolve } from 'path';
import React from 'react';
import { Terminal } from 'react-feather';
import { cssRule } from 'typestyle';
import { clone, getPath } from '../../util/DataUtil';
import { extractPng, loadGff, saveGff } from '../../util/XoreosTools';
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

export interface AppState {
  data: any;
  history: any[];
  historyIndex: number;
  lastUpdated: string;
  tgaPath?: string;
  guiFile?: string;
  selected?: any;
  extracting?: string;
}

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
    this.load();

    window.onerror = this.handleError;

    bind(['ctrl+shift+i', 'command+option+i'], () => remote.getCurrentWindow().webContents.toggleDevTools());
    bind(['mod+r', 'shift+mod+r'], () => remote.getCurrentWindow().reload());

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

    extractPng(this.state.tgaPath, toolsPath, this.state.data, (s: any) => this.setState(s), this.handleError, clear);
  }

  private load() {
    if (!this.state.guiFile) return;

    loadGff(
      this.state.guiFile,
      toolsPath,
      (s: any) => {
        this.setState(s, () => {
          console.log('data', s.data);
          this.extract();
        });
      },
      this.handleError
    );
  }

  private updateData = (data: any, cb?: () => void) => {
    let history = [...this.state.history, clone(this.state.data)];

    // Determine if we need to update the last history item or make a new entry (so things like rename won't blow up history stack)
    const diff: any = detailedDiff(this.state.history[this.state.history.length - 1], data);
    const wasAdded = Object.keys(diff.added).length > 0;
    const wasDeleted = Object.keys(diff.deleted).length > 0;
    const wasUpdated = Object.keys(diff.updated).length > 0;

    let lastUpdated = '';
    // Check only if something was updated
    if (wasUpdated && !wasAdded && !wasDeleted) {
      try {
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
  private changeHistory(dir: number) {
    const historyIndex = this.state.historyIndex + dir;
    if (historyIndex > 0 && this.state.history.length >= historyIndex) {
      const data = clone(this.state.history[this.state.history.length - historyIndex]);

      this.setState({ data, historyIndex });
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
            />
            <Button onClick={() => this.load()} title="Revert all unsaved changes">
              Revert
            </Button>
            <Button onClick={() => saveGff(this.state.guiFile!, toolsPath, this.state.data, this.handleError)} title="Save .gui file">
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
