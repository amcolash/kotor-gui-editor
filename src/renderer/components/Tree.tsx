import React from 'react';

interface TreeProps {
  data: any; // TODO
}

interface TreeState {
  selected?: any;
}

export default class Tree extends React.Component<TreeProps, TreeState> {
  private stringify(data: any, d: string, space: number): string {
    if (data.exostring) {
      let label;
      if (data.exostring._attributes) label = data.exostring._text;
      else if (Array.isArray(data.exostring)) {
        data.exostring.forEach((e: any) => {
          if (e._attributes.label === 'TAG') label = e._text;
        });
      }
      d += ''.padStart(space) + label;
    }

    if (data.list && data.list.struct) {
      // d += `\n${''.padStart(space + 1)}${JSON.stringify(data.struct.list._attributes)}`;
      data.list.struct.forEach((e: any) => {
        d += this.stringify(e, '\n', space + 2);
      });
    }

    return d;
  }

  public render() {
    return <div style={{ whiteSpace: 'pre', overflowY: 'scroll' }}>{this.stringify(this.props.data.gff3.struct, '', 0)}</div>;
  }
}
