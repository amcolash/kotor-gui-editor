import React from 'react';
import FilePicker from './FilePicker';
import { style } from 'typestyle';

const className = style({
  fontFamily: 'sans-serif',
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
      </div>
    );
  }
}
