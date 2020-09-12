import React from 'react';
import * as tinycolor from 'tinycolor2';
import { style } from 'typestyle';

const structName = style({
  marginLeft: 14,
});

const itemStyle = style({
  padding: 4,
});

interface ItemControlProps {
  selected?: any;
  data: any;
  updateData: (data: any) => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
}

export default class ItemControl extends React.Component<ItemControlProps> {
  private makeControl(type: string, label: string, data: any, cb: (newData: any) => void): JSX.Element | undefined {
    let control;

    switch (type) {
      case 'id':
        control = <input type="text" value={data || ''} onChange={(e) => cb(e.target.value)} />;
        break;
      case 'exostring':
      case 'resref':
        control = <input type="text" value={data.$t || ''} onChange={(e) => cb({ ...data, $t: e.target.value })} />;
        break;
      case 'byte':
        control = <input type="checkbox" checked={data.$t === '1'} onChange={(e) => cb({ ...data, $t: e.target.checked ? '1' : '0' })} />;
        break;
      case 'sint32':
        control = <input type="number" value={data.$t} onChange={(e) => cb({ ...data, $t: e.target.value })} />;
        break;
      case 'struct':
        control = <div className={structName}>{this.makeControls(data)}</div>;
        break;
      case 'vector':
        control = data.double.map((d: any, i: number) => (
          <input
            type="number"
            value={d.$t}
            key={i}
            onChange={(e) => {
              const updated = { ...data };
              updated.double[i].$t = parseFloat(e.target.value).toFixed(7);
              cb({ ...updated });
            }}
            min="0"
            max="1"
            step="0.01"
          />
        ));
        if (data.label === 'COLOR') {
          const hex = tinycolor.fromRatio({ r: data.double[0].$t, g: data.double[1].$t, b: data.double[2].$t }).toHexString();

          control.push(
            <input
              type="color"
              value={hex}
              key="picker"
              onChange={(e) => {
                const updated = { ...data };
                const rgb = tinycolor(e.target.value).toRgb();

                updated.double[0].$t = (rgb.r / 255).toFixed(7);
                updated.double[1].$t = (rgb.g / 255).toFixed(7);
                updated.double[2].$t = (rgb.b / 255).toFixed(7);

                cb({ ...updated });
              }}
            />
          );
        }
        break;
      default:
        return;
    }

    return (
      <div key={label} className={itemStyle}>
        {label}: {control}
      </div>
    );
  }

  private makeControls(data: any): JSX.Element {
    const children: JSX.Element[] = [];
    Object.keys(data).forEach((k) => {
      if (Array.isArray(data[k])) {
        // Need to iterate over the array this way so that we can muck around with the data and it isn't duplicated
        for (let i = 0; i < data[k].length; i++) {
          const c = this.makeControl(k, data[k][i].label, data[k][i], (updated) => {
            data[k][i] = updated;
            this.props.updateData(this.props.data);
          });
          if (c) children.push(c);
        }
      } else {
        const c = this.makeControl(k, data[k].label || k, data[k], (updated) => {
          data[k] = updated;
          this.props.updateData(this.props.data);
        });
        if (c) children.push(c);
      }
    });

    return <div>{children}</div>;
  }

  public render() {
    return (
      this.props.selected && (
        <div className="itemBar" style={{ width: 250, overflowY: 'scroll', paddingLeft: 8, borderLeft: '1px solid #999' }}>
          {this.makeControls(this.props.selected)}
        </div>
      )
    );
  }
}
