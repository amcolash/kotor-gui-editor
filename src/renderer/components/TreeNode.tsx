import React from 'react';
import { CornerDownRight } from 'react-feather';
import { cssRule } from 'typestyle';
import { darkSelection, lightSelection } from '../../util/Colors';

cssRule('.treeItem', {
  padding: 2,
  cursor: 'pointer',
  $nest: {
    '&:hover': {
      outline: '1px solid #ccc',
    },
  },
});

interface TreeNodeProps {
  label: string;
  data: any;
  selected: boolean;
  isChild: boolean;
  updateSelected: (data: any) => void;
  darkMode: boolean;
}

export default class TreeNode extends React.Component<TreeNodeProps> {
  private focusItem(dir: number): void {
    const focusableEls: HTMLElement[] = Array.from(document.querySelectorAll('.treeItem'));

    const activeElement = document.activeElement;
    let index = 0;
    if (activeElement) {
      for (let i = 0; i < focusableEls.length; i++) {
        if (focusableEls[i] === activeElement) index = i;
      }
    }

    index += dir;
    index = Math.max(0, Math.min(index, focusableEls.length - 1));

    focusableEls[index].focus();
  }

  public render() {
    return (
      <div key={this.props.label}>
        <div
          className={'treeItem' + (this.props.selected ? ' selected' : '')}
          onFocus={(e) => {
            this.props.updateSelected(this.props.data);
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') this.focusItem(1);
            if (e.key === 'ArrowUp') this.focusItem(-1);
          }}
          tabIndex={0}
          style={{ background: this.props.selected ? (this.props.darkMode ? darkSelection : lightSelection) : undefined }}
        >
          {this.props.isChild && <CornerDownRight size="12" style={{ marginRight: 4 }} />}
          {this.props.label}
        </div>
        {this.props.children && <div style={{ marginLeft: 14 }}>{this.props.children}</div>}
      </div>
    );
  }
}
