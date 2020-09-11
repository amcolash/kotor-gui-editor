import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import React from 'react';
import { cssRule, style } from 'typestyle';
import { parseString } from 'xml2js';
import Button from './Button';
import FilePicker from './FilePicker';

cssRule('body', {
  margin: 0,
  overflow: 'hidden',
  background: 'white',
});

const className = style({
  fontFamily: 'sans-serif',
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

interface AppState {
  toolsPath?: string;
  guiFile?: string;
}

export default class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    const localState = localStorage.getItem('state');
    if (localState) {
      this.state = JSON.parse(localState);
    } else {
      this.state = {};
    }
  }

  private updateFilePath = (state: Partial<AppState>) => {
    this.setState(state, () => {
      localStorage.setItem('state', JSON.stringify(this.state));
    });
  };

  private loadGff = () => {
    if (this.state.toolsPath && existsSync(this.state.toolsPath) && this.state.guiFile && existsSync(this.state.guiFile)) {
      const resolvedTool = resolve(this.state.toolsPath, 'gff2xml');
      const resolvedGui = resolve(this.state.guiFile);

      const command = `${resolvedTool} ${resolvedGui}`;
      const buff = execSync(command);

      parseString(buff.toString(), (err, res) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log(res);
      });
    }
  };

  public render() {
    return (
      <div className={className}>
        <FilePicker
          label="Tools Path"
          file={this.state.toolsPath}
          filter="directory"
          updateFile={(file) => this.updateFilePath({ toolsPath: file })}
        />
        <FilePicker label="GUI File" file={this.state.guiFile} filter="gui" updateFile={(file) => this.updateFilePath({ guiFile: file })} />
        <Button onClick={this.loadGff}>Load</Button>
      </div>
    );
  }
}
