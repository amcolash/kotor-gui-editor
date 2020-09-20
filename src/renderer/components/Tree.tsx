import React from 'react';
import { getLabel } from '../util/DataUtil';
import TreeNode from './TreeNode';

interface TreeProps {
  data: GFF;
  selected?: Struct;
  updateSelected: (data?: Struct) => void;
  darkMode: boolean;
}

export default class Tree extends React.Component<TreeProps> {
  public componentDidUpdate() {
    const selected = document.querySelector('.selected');
    if (selected) selected.scrollIntoView();
  }

  private makeNode(data: Struct, isChild?: boolean): JSX.Element {
    const label = getLabel(data);

    const children: JSX.Element[] = [];
    if (data.list) {
      data.list.struct.forEach((e: Struct) => {
        children.push(this.makeNode(e, true));
      });
    }
    if (data.struct) {
      data.struct.forEach((e: Struct) => {
        if (e.label === 'PROTOITEM' || e.label === 'SCROLLBAR') {
          children.push(this.makeNode(e, true));
        }
      });
    }

    return (
      <TreeNode
        key={label}
        label={label}
        data={data}
        isChild={isChild || false}
        selected={data === this.props.selected}
        updateSelected={this.props.updateSelected}
        darkMode={this.props.darkMode}
      >
        {children}
      </TreeNode>
    );
  }

  public render() {
    const root = this.props.data.gff3.struct[0];
    if (!root) return null;

    return (
      <div
        className="tree"
        style={{ width: 250, whiteSpace: 'pre', overflowY: 'scroll', padding: '2px 8px 2px 2px' }}
        onClick={(e) => this.props.updateSelected(undefined)}
      >
        {this.makeNode(root)}
      </div>
    );
  }
}
