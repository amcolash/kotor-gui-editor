import React from 'react';
import { cssRule } from 'typestyle';

cssRule('.tree', {
  padding: 2,
  $nest: {
    '&.selected': {
      backgroundColor: 'lime',
    },
  },
});

interface TreeProps {
  data: any; // TODO Typedefs
  selected?: any;
  updateSelected: (data: any) => void;
}

export default class Tree extends React.Component<TreeProps> {
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

    return (
      <div
        onClick={(e) => {
          this.props.updateSelected(data);
          e.stopPropagation();
        }}
        key={label}
      >
        <div className={data === this.props.selected ? 'tree selected' : 'tree'}>{label}</div>
        {children && <div style={{ marginLeft: 14 }}>{children}</div>}
      </div>
    );
  }

  public render() {
    return <div style={{ width: '20%', whiteSpace: 'pre', overflowY: 'scroll' }}>{this.makeNode(this.props.data.gff3.struct[0])}</div>;
  }
}
