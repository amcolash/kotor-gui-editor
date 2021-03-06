import React from 'react';
import PropertyNode from './PropertyNode';

interface PropertyListProps {
  selected?: Struct;
  updateData: () => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
  darkMode: boolean;
}

export default class PropertyList extends React.Component<PropertyListProps> {
  ref: React.RefObject<HTMLDivElement> = React.createRef();

  public componentDidUpdate() {
    if (this.ref?.current) this.ref.current.scrollTop = 0;
  }

  private makeControl(type: string, label: string, data: any, cb: (newData: any) => void): JSX.Element | undefined {
    // Make separate sub-items for these
    if (type === 'struct' && (label === 'PROTOITEM' || label === 'SCROLLBAR')) return;

    let children;
    if (type === 'struct') children = this.makeControls(data);

    return (
      <PropertyNode type={type} label={label} cb={cb} data={data} key={label} darkMode={this.props.darkMode}>
        {children}
      </PropertyNode>
    );
  }

  // TODO: Make this better! w/ Typedefs
  private makeControls(data: any): JSX.Element {
    const children: JSX.Element[] = [];
    Object.keys(data).forEach((k) => {
      if (Array.isArray(data[k])) {
        // Need to iterate over the array this way so that we can muck around with the data and it isn't duplicated
        for (let i = 0; i < data[k].length; i++) {
          const c = this.makeControl(k, data[k][i].label, data[k][i], (updated) => {
            data[k][i] = updated;
            this.props.updateData();
          });
          if (c) children.push(c);
        }
      } else {
        const c = this.makeControl(k, data[k].label || k, data[k], (updated) => {
          data[k] = updated;
          this.props.updateData();
        });
        if (c) children.push(c);
      }
    });

    return <div>{children}</div>;
  }

  public render() {
    return (
      <div className="propertyList" ref={this.ref} style={{ width: 225, overflowY: 'scroll', padding: '0 8px' }}>
        <h3 style={{ marginTop: 0 }}>Node Properties</h3>
        {this.props.selected ? this.makeControls(this.props.selected) : <span>Nothing Selected</span>}
      </div>
    );
  }
}
