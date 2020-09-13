import { spawn, spawnSync } from 'child_process';
import { remote } from 'electron';
import { exists, existsSync, readFile, readFileSync, writeFileSync } from 'fs';
import { emptyDir, mkdirp } from 'fs-extra';
import { basename, join, resolve } from 'path';
import React from 'react';
import tga2png from 'tga2png';
import { cssRule } from 'typestyle';
import { promisify } from 'util';
import { toJson, toXml } from 'xml2json';
import Button from './Button';
import FilePicker from './FilePicker';
import ItemControl from './ItemControl';
import Preview from './Preview';
import Tree from './Tree';

cssRule('body', {
  margin: 0,
  overflow: 'hidden',
  background: 'white',
  fontFamily: 'sans-serif',
});

interface AppState {
  toolsPath?: string;
  tgaPath?: string;
  guiFile?: string;
  data: any;
  selected?: any;
  extracting?: string;
}

export const emptyDirAsync = promisify(emptyDir);
export const existsAsync = promisify(exists);
export const mkdirpAsync = promisify(mkdirp);
export const readFileAsync = promisify(readFile);
export const spawnAsync = promisify(spawn);

export const tmpDir = join(remote.app.getPath('temp'), 'kotor-gui');

export default class App extends React.Component<{}, AppState> {
  state: AppState = {
    data: '',
    toolsPath: localStorage.getItem('toolsPath') || undefined,
    tgaPath: localStorage.getItem('tgaPath') || undefined,
    guiFile: localStorage.getItem('guiFile') || undefined,
  };

  // TODO: Only for dev
  public componentDidMount() {
    this.loadGff();
  }

  private checkPaths = () => {
    return this.state.toolsPath && existsSync(this.state.toolsPath) && this.state.guiFile && existsSync(this.state.guiFile);
  };

  private extractPng = async (clear?: boolean) => {
    if (this.state.tgaPath && this.state.data) {
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
      console.log('extracting images:', items);

      const resolvedTgaPath = resolve(this.state.tgaPath);
      const destDir = join(tmpDir, 'pngs');
      await mkdirpAsync(destDir);
      if (clear) await emptyDirAsync(destDir);

      for (let i = 0; i < items.length; i++) {
        this.setState({ extracting: `(${i + 1}/${items.length})` });

        const tgaPath = join(resolvedTgaPath, items[i] + '.tga');
        const tpcPath = join(resolvedTgaPath, items[i] + '.tpc');

        if (await existsAsync(tgaPath)) {
          const dest = join(destDir, items[i] + '.png');
          if (!(await existsAsync(dest))) await tga2png(tgaPath, dest);
        } else if (await existsAsync(tpcPath)) {
          console.log('no tga, trying tpc', tpcPath);
        } else {
          console.log('no image found for', items[i]);
        }
      }

      this.setState({ extracting: undefined });
    }
  };

  private loadGff = () => {
    if (this.checkPaths()) {
      const resolvedTool = resolve(this.state.toolsPath!, 'gff2xml');
      const resolvedGui = resolve(this.state.guiFile!);
      const resolvedXml = resolve(tmpDir, basename(this.state.guiFile! + '-loaded.xml'));

      const args = ['--kotor', resolvedGui, resolvedXml];
      const s = spawnSync(resolvedTool, args);
      if (s.stdout) console.log(s.stdout.toString());
      if (s.stderr) console.error(s.stderr.toString());

      const xml = readFileSync(resolvedXml);

      const data = toJson(xml, {
        object: true,
        reversible: true,
        sanitize: true,
        trim: true,
        arrayNotation: ['sint32', 'byte', 'exostring', 'struct', 'vector', 'resref'],
      });

      this.setState({ data, selected: undefined }, () => {
        console.log('data', this.state.data);
        this.extractPng();
      });
    }
  };

  private saveGff = () => {
    if (this.checkPaths()) {
      const resolvedTool = resolve(this.state.toolsPath!, 'xml2gff');
      const resolvedXml = resolve(tmpDir, basename(this.state.guiFile! + '-saved.xml'));
      const resolvedGui = resolve(this.state.guiFile! + '-new.gui');

      const xml = toXml(this.state.data);
      writeFileSync(resolvedXml, xml);

      const args = ['--kotor', resolvedXml, resolvedGui];
      const s = spawnSync(resolvedTool, args);
      if (s.stdout) console.log(s.stdout.toString());
      if (s.stderr) console.error(s.stderr.toString());
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FilePicker
            label="Tools Path"
            file={this.state.toolsPath}
            filter="directory"
            updateFile={(file) => {
              this.setState({ toolsPath: file }, () => {
                localStorage.setItem('toolsPath', file);
              });
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
            <Button onClick={() => this.extractPng(true)}>Reload Assets</Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
            <Button onClick={this.loadGff}>Revert</Button>
            <Button onClick={this.saveGff}>Save</Button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: 8 }}>
          <Tree data={this.state.data} selected={this.state.selected} updateSelected={(selected: any) => this.setState({ selected })} />
          <Preview
            data={this.state.data}
            selected={this.state.selected}
            updateSelected={(selected: any) => this.setState({ selected })}
            updateData={(data, cb) => this.setState(data, () => cb())}
          />
          <ItemControl selected={this.state.selected} updateData={(data) => this.setState(data)} data={this.state.data} />
        </div>
      </div>
    );
  }
}
