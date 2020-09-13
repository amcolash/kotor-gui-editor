import React from 'react';
import { cssRule } from 'typestyle';

cssRule('.treeItem', {
  padding: 2,
  cursor: 'pointer',
  $nest: {
    '&.selected': {
      backgroundColor: 'lime',
    },
    '&:hover': {
      outline: '1px solid #ccc',
    },
  },
});

interface TreeProps {
  data: any; // TODO Typedefs
  selected?: any;
  updateSelected: (data: any) => void;
}

export default class Tree extends React.Component<TreeProps> {
  public componentDidUpdate() {
    const selected = document.querySelector('.selected');
    if (selected) selected.scrollIntoView();
  }

  private makeNode(data: any): JSX.Element {
    let label: string = '';
    if (data.exostring) {
      if (data.exostring.label === 'TAG') label = data.exostring.$t;
      else if (Array.isArray(data.exostring)) {
        data.exostring.forEach((e: any) => {
          if (e.label === 'TAG') label = e.$t;
        });
      }
    }

    const children: JSX.Element[] = [];
    if (data.list && data.list.struct) {
      data.list.struct.forEach((e: any) => {
        children.push(this.makeNode(e));
      });
    }
    if (data.struct) {
      data.struct.forEach((e: any) => {
        if (e.label === 'PROTOITEM' || e.label === 'SCROLLBAR') {
          children.push(this.makeNode(e));
        }
      });
    }

    return (
      <div key={label}>
        <div
          className={'treeItem' + (data === this.props.selected ? ' selected' : '')}
          onFocus={(e) => {
            this.props.updateSelected(data);
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') this.focusItem(1);
            if (e.key === 'ArrowUp') this.focusItem(-1);
          }}
          tabIndex={0}
        >
          {label}
        </div>
        {children && <div style={{ marginLeft: 14 }}>{children}</div>}
      </div>
    );
  }

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
    const root = this.props.data.gff3.struct[0];
    return (
      <div className="tree" style={{ width: 250, whiteSpace: 'pre', overflowY: 'scroll' }}>
        {this.makeNode(root)}
      </div>
    );
  }
}
