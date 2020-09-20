import { all, create } from 'mathjs';
import React, { Fragment } from 'react';
import { AlertOctagon, Check, Pause, X } from 'react-feather';
import { iconSize } from '../util/Consts';
import Button from './Button';

interface MathInputState {
  modal: boolean;
  modalValue: string;
}

export default class MathInput extends React.Component<React.InputHTMLAttributes<HTMLInputElement>, MathInputState> {
  state = { modal: false, modalValue: '' };

  private updateValue = (newValue: string | number | readonly string[] | undefined) => {
    this.closeModal(() => {
      // This is a bit of a nasty hack but it means we do not need a separate onchange handler for math evals
      (this.props.onChange as any)({ target: { value: newValue } });
    });
  };

  private closeModal = (cb?: () => void) => {
    this.setState({ modal: false }, cb);
  };

  public render() {
    const math = create(all, {});
    let result: string | undefined;
    try {
      result = math.evaluate!(this.state.modalValue);
    } catch (e) {
      // Couldn't eval expression
    }

    return (
      <Fragment>
        {this.state.modal && (
          <div
            style={{
              width: '100vw',
              height: '100vh',
              zIndex: 2,
              position: 'fixed',
              left: 0,
              top: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(230, 230, 230, 0.7)',
            }}
            // Key down on the modal so that any key press will trigger proper handler, not just on input
            onKeyDown={(e) => {
              if (e.key === 'Escape') this.closeModal();
              if (e.key === 'Enter' && result !== undefined) this.updateValue(result !== undefined ? result : this.props.value);
            }}
          >
            <div
              style={{
                minWidth: 250,
                background: '#eee',
                padding: 20,
                border: '2px solid #444',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <Button style={{ position: 'absolute', top: 0, right: 4, padding: 0, border: 'none' }} onClick={() => this.closeModal()}>
                <X size={iconSize} />
              </Button>
              <div style={{ paddingRight: 10 }}>Input a math expression for {this.props.name}</div>
              <div style={{ display: 'flex', padding: '12px 0' }}>
                <input
                  type="text"
                  value={this.state.modalValue}
                  autoFocus
                  style={{ flex: 1, marginRight: 6, outline: result === undefined ? '1px solid red' : '1px solid green' }}
                  onChange={(e) => this.setState({ modalValue: e.target.value })}
                />
                <Button
                  style={{ margin: 0, padding: '0 2px' }}
                  disabled={result === undefined}
                  onClick={() => this.updateValue(result !== undefined ? result : this.props.value)}
                >
                  {result !== undefined ? (
                    <Check size={iconSize} style={{ color: 'green' }} />
                  ) : (
                    <AlertOctagon size={iconSize} style={{ color: 'red' }} />
                  )}
                </Button>
              </div>
              <div>Result: {result !== undefined ? result : 'Invalid Expression'}</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex' }}>
          <input {...this.props} type="number" style={{ flex: 1, marginRight: 6 }} />
          <Button
            style={{ margin: 0, padding: '0 2px' }}
            onClick={() => this.setState({ modal: true, modalValue: `${this.props.value} ` })}
          >
            <Pause size={iconSize} style={{ transform: 'rotate(90deg)' }} />
          </Button>
        </div>
      </Fragment>
    );
  }
}
