import React from 'react';
import * as tinycolor from 'tinycolor2';
import { style } from 'typestyle';

const structName = style({
  marginLeft: 14,
});

const itemStyle = style({
  padding: 4,
});

interface PropertyNodeProps {
  type: string;
  label: string;
  data: any;
  cb: (newData: any) => void;
}

export default class PropertyNode extends React.Component<PropertyNodeProps> {
  render() {
    const { cb, data, label, type } = this.props;

    let control;

    // Make separate sub-items for these
    if (type === 'struct' && (label === 'PROTOITEM' || label === 'SCROLLBAR')) return;

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
        control = (
          <input type="number" value={data.$t} step="1" onChange={(e) => cb({ ...data, $t: parseFloat(e.target.value).toFixed(0) })} />
        );
        break;
      case 'uint32':
        control = (
          <input
            type="number"
            value={data.$t}
            min="0"
            step="1"
            onChange={(e) => cb({ ...data, $t: parseFloat(e.target.value).toFixed(0) })}
          />
        );
        break;
      case 'float':
      case 'double':
        control = <input type="number" step="0.01" value={data.$t} onChange={(e) => cb({ ...data, $t: e.target.value })} />;
        break;
      case 'struct':
        control = <div className={structName}>{this.props.children}</div>;
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
        // console.log('missing node for', type, data);
        return null;
    }

    return (
      <div key={label} className={itemStyle}>
        {label}: {control}
      </div>
    );
  }
}
