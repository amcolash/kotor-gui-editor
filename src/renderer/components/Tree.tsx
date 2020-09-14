import React from 'react';
import TreeNode from './TreeNode';

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

  private makeNode(data: any, isChild?: boolean): JSX.Element {
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
        children.push(this.makeNode(e, true));
      });
    }
    if (data.struct) {
      data.struct.forEach((e: any) => {
        if (e.label === 'PROTOITEM' || e.label === 'SCROLLBAR') {
          children.push(this.makeNode(e, true));
        }
      });
    }

    return (
      <TreeNode
        label={label}
        data={data}
        isChild={isChild || false}
        selected={data === this.props.selected}
        updateSelected={this.props.updateSelected}
      >
        {children}
      </TreeNode>
    );
  }

  public render() {
    if (!this.props.data) return null;

    const root = this.props.data.gff3.struct[0];
    return (
      <div className="tree" style={{ width: 250, whiteSpace: 'pre', overflowY: 'scroll', padding: 2 }}>
        {this.makeNode(root)}
      </div>
    );
  }
}
