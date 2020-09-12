import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { writeFileSync } from 'original-fs';
import { resolve } from 'path';
import React from 'react';
import { cssRule, style } from 'typestyle';
import { toJson, toXml } from 'xml2json';
import Button from './Button';
import FilePicker from './FilePicker';
import Tree from './Tree';

cssRule('body', {
  margin: 0,
  overflow: 'hidden',
  background: 'white',
});

const className = style({
  fontFamily: 'sans-serif',
  padding: 10,
  width: 'calc(100vw - 20px)',
  height: 'calc(100vh - 20px)',
  display: 'flex',
  flexDirection: 'column',
});

interface AppState {
  toolsPath?: string;
  tgaPath?: string;
  guiFile?: string;
  data: any;
}

export default class App extends React.Component<{}, AppState> {
  state: AppState = {
    data: '',
    toolsPath: localStorage.getItem('toolsPath') || undefined,
    tgaPath: localStorage.getItem('tgaPath') || undefined,
    guiFile: localStorage.getItem('guiFile') || undefined,
  };

  public componentDidMount() {
    this.loadGff();
  }

  private checkPaths = () => {
    return this.state.toolsPath && existsSync(this.state.toolsPath) && this.state.guiFile && existsSync(this.state.guiFile);
  };

  private loadGff = () => {
    if (this.checkPaths()) {
      const resolvedTool = resolve(this.state.toolsPath!, 'gff2xml');
      const resolvedGui = resolve(this.state.guiFile!);
      const resolvedXml = resolve(this.state.guiFile! + '-loaded.xml');

      const command = `${resolvedTool} --kotor ${resolvedGui} ${resolvedXml}`;

      var s = spawnSync(command);
      if (s.stdout) console.log(s.stdout.toString());
      if (s.stderr) console.error(s.stderr.toString());

      const xml = readFileSync(resolvedXml);

      const data = toJson(xml, { object: true, reversible: true, sanitize: true, trim: true });
      this.setState({ data });

      console.log('data', data);
    }
  };

  private saveGff = () => {
    if (this.checkPaths()) {
      const resolvedTool = resolve(this.state.toolsPath!, 'xml2gff');
      const resolvedGui = resolve(this.state.guiFile! + '-new.gui');
      const resolvedXml = resolve(this.state.guiFile! + '-saved.xml');

      const xml = toXml(this.state.data);
      writeFileSync(resolvedXml, xml);

      const command = `${resolvedTool} --kotor ${resolvedXml} ${resolvedGui}`;

      var s = spawnSync(command);
      if (s.stdout) console.log(s.stdout.toString());
      if (s.stderr) console.error(s.stderr.toString());
    }
  };

  public render() {
    return (
      <div className={className}>
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
        <FilePicker
          label="TGA Path"
          file={this.state.tgaPath}
          filter="directory"
          updateFile={(file) => {
            this.setState({ tgaPath: file }, () => {
              localStorage.setItem('tgaPath', file);
            });
          }}
        />
        <FilePicker
          label="GUI File"
          file={this.state.guiFile}
          filter="gui"
          updateFile={(file) => {
            this.setState({ guiFile: file }, () => {
              localStorage.setItem('guiFile', file);
            });
          }}
        />
        <Button onClick={this.loadGff}>Load</Button>
        <Button onClick={this.saveGff}>Save</Button>

        {this.state.data && <Tree data={this.state.data} />}
      </div>
    );
  }
}
