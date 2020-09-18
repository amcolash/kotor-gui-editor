import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { X } from 'react-feather';
import { electronRoot, toolsPath } from './App';
import Button from './Button';

interface LicenseProps {
  close: () => void;
}

interface LicensesState {
  licenses: string;
}

export default class License extends React.Component<LicenseProps, LicensesState> {
  state = {
    licenses: '',
  };

  public componentDidMount() {
    const thirdParty = join(electronRoot, '3rd-party-licenses.txt');
    const xoreos = join(toolsPath, 'COPYING');
    this.setState({
      licenses: readFileSync(thirdParty).toString() + '\n\n\n---------------------\n\n\nxoreos-tools\n\n\n' + readFileSync(xoreos),
    });
  }

  public render() {
    return (
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2, display: 'flex', pointerEvents: 'none' }}
      >
        <div
          style={{
            background: '#eee',
            padding: 20,
            margin: 50,
            overflowY: 'scroll',
            border: '2px solid #333',
            pointerEvents: 'auto',
            whiteSpace: 'pre',
          }}
        >
          {this.state.licenses}
          <Button style={{ position: 'absolute', top: 60, right: 80, background: '#eee' }} onClick={() => this.props.close()}>
            <X size="14" />
          </Button>
        </div>
      </div>
    );
  }
}
