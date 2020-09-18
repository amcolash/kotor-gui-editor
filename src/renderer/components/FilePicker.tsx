import { remote } from 'electron';
import { existsSync } from 'fs';
import React, { CSSProperties } from 'react';
import { style } from 'typestyle';

const className = style({
  padding: 6,
  display: 'flex',
  flexDirection: 'column',

  $nest: {
    'label, input': {
      display: 'block',
    },
    label: {
      marginRight: 8,
    },
    'input.invalid': {
      border: '1px solid red',
    },
  },
});

interface FilePickerProps {
  updateFile: (file: string) => void;
  label?: string;
  file?: string;
  filter?: string | 'directory';
  style?: CSSProperties;
  darkMode: boolean;
}

export default class FilePicker extends React.Component<FilePickerProps> {
  private chooseFile = () => {
    const options: Electron.OpenDialogOptions = { defaultPath: this.props.file };
    if (this.props.filter) {
      if (this.props.filter === 'directory') {
        options.properties = ['openDirectory'];
      } else {
        options.filters = [{ extensions: [this.props.filter], name: this.props.filter }];
      }
    }

    const files = remote.dialog.showOpenDialogSync(options);
    if (files && files.length === 1) {
      this.props.updateFile(files[0]);
    }
  };

  public render(): JSX.Element {
    const valid = this.props.file ? existsSync(this.props.file) : false;

    return (
      <div className={className} style={this.props.style}>
        {this.props.label && <label>{this.props.label}</label>}
        <input
          value={this.props.file || ''}
          onClick={this.chooseFile}
          readOnly
          className={valid ? 'valid' : 'invalid'}
          style={{ flex: 1, margin: '4px 0 2px', padding: this.props.darkMode ? 5 : 4 }}
        />
      </div>
    );
  }
}
