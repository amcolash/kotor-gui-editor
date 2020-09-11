import React from 'react';
import { style } from 'typestyle';

const className = style({
  padding: 5,
  margin: 5,
  background: 'transparent',
  border: '1px solid #999',
  borderRadius: 2,
});

export default class Button extends React.Component<React.HTMLAttributes<HTMLButtonElement>> {
  public render() {
    return <button {...this.props} className={className} />;
  }
}
