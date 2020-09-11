import { remote } from 'electron';
import { existsSync } from 'fs';
import React from 'react';
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
}

export default class FilePicker extends React.Component<FilePickerProps> {
  private chooseFile = () => {
    const options: Electron.OpenDialogOptions = {};
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
      <div className={className}>
        {this.props.label && <label>{this.props.label}</label>}
        <input value={this.props.file || ''} onClick={this.chooseFile} readOnly className={valid ? 'valid' : 'invalid'} />
      </div>
    );
  }
}
