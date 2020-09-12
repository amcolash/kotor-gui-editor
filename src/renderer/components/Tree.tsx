import React from 'react';

interface TreeProps {
  data: any; // TODO
}

interface TreeState {
  selected?: any;
}

export default class Tree extends React.Component<TreeProps, TreeState> {
  state = { selected: undefined };

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
          this.setState({ selected: data });
          e.stopPropagation();
        }}
        key={label}
      >
        <label style={{ backgroundColor: data === this.state.selected ? 'lime' : undefined, padding: 3 }}>{label}</label>
        {children && <div style={{ marginLeft: 14 }}>{children}</div>}
      </div>
    );
  }

  private makeControl(type: string, label: string, data: any): JSX.Element | undefined {
    let control;
    switch (type) {
      case 'id':
        control = <input type="text" value={data} />;
        break;
      case 'exostring':
      case 'resref':
        control = <input type="text" value={data.$t} />;
        break;
      case 'sint32':
        control = <input type="number" value={data.$t} />;
        break;
      case 'struct':
        control = <div style={{ marginLeft: 14 }}>{this.makeControls(data)}</div>;
        break;
      case 'vector':
        control = data.double.map((d: any) => <input type="number" value={d.$t} />);
        break;
      default:
        return;
    }

    return (
      <div key={label} style={{ padding: 4 }}>
        {label}: {control}
      </div>
    );
  }

  private makeControls(data: any): JSX.Element {
    console.log(data);

    const children: JSX.Element[] = [];
    Object.keys(data).forEach((k) => {
      if (Array.isArray(data[k])) {
        data[k].forEach((d: any) => {
          const c = this.makeControl(k, d.label, d);
          if (c) children.push(c);
        });
      } else {
        const c = this.makeControl(k, data[k].label || k, data[k]);
        if (c) children.push(c);
      }
    });

    return <div>{children}</div>;
  }

  public render() {
    return (
      <div style={{ display: 'flex', minHeight: 0 }}>
        <div style={{ width: '50%', whiteSpace: 'pre', overflowY: 'scroll' }}>{this.makeNode(this.props.data.gff3.struct)}</div>
        {this.state.selected && (
          <div style={{ width: '50%', whiteSpace: 'pre', overflowY: 'scroll' }}>{this.makeControls(this.state.selected)}</div>
        )}
      </div>
    );
  }
}
