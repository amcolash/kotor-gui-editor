import { readFileSync } from 'fs';
import { join } from 'path';
import React, { CSSProperties } from 'react';
import { tmpDir } from './App';

const imageCache: { [key: string]: string } = {};
const zoom = 0.6;
let coords = { x: 0, y: 0 };

interface ScreenProps {
  data: any; // TODO Typedefs
  selected?: any;
  updateData: (data: any) => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
  updateSelected: (data: any) => void;
}

export default class Screen extends React.Component<ScreenProps> {
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

    let style: CSSProperties = {};
    if (data.struct) {
      data.struct.forEach((s: any) => {
        if (s.label === 'EXTENT') {
          style.border = '1px solid #555';
          style.position = 'absolute';
          if (this.props.selected === data) style.outline = '2px solid lime';
          s.sint32.forEach((s: any) => {
            if (s.label === 'TOP') style.top = parseInt(s.$t);
            if (s.label === 'LEFT') style.left = parseInt(s.$t);
            if (s.label === 'WIDTH') style.width = parseInt(s.$t);
            if (s.label === 'HEIGHT') style.height = parseInt(s.$t);
          });
        } else if (s.label === 'BORDER') {
          let showImg = false;
          s.sint32.forEach((s: any) => {
            if (s.label === 'FILLSTYLE' && s.$t === '2') showImg = true;
          });

          if (showImg) {
            s.resref.forEach((s: any) => {
              if (s.label === 'FILL' && s.$t) {
                style.backgroundRepeat = 'no-repeat';
                style.backgroundSize = 'cover';

                const img = join(tmpDir, 'pngs', s.$t + '.png');
                if (!imageCache[img]) {
                  try {
                    // Meh on perf here, but it should usually be a reasonably small amount of images
                    const buf = readFileSync(img);
                    imageCache[img] = 'data:image/png;base64,' + buf.toString('base64');
                    style.backgroundImage = `url(${imageCache[img]})`;
                  } catch (e) {
                    console.error(e);
                    if (!imageCache[img]) imageCache[img] = 'error';
                  }
                } else if (imageCache[img] !== 'error') {
                  style.backgroundImage = `url(${imageCache[img]})`;
                }
              }
            });
          }
        }
      });
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
          if (data !== this.props.selected) e.stopPropagation();
          this.props.updateSelected(data);
        }}
        style={style}
        key={label}
        draggable={data === this.props.selected}
        onDragStart={(e) => {
          if (data !== this.props.selected) return;

          coords.x = e.clientX;
          coords.y = e.clientY;
        }}
        onDragEnd={(e) => {
          if (data !== this.props.selected) return;

          const diffX = (coords.x - e.clientX) / zoom;
          const diffY = (coords.y - e.clientY) / zoom;

          console.log(diffX, diffY);

          data.struct.forEach((s: any) => {
            if (s.label === 'EXTENT') {
              s.sint32.forEach((s: any) => {
                if (s.label === 'TOP') s.$t = Math.floor(parseInt(s.$t) - diffY).toString();
                if (s.label === 'LEFT') s.$t = Math.floor(parseInt(s.$t) - diffX).toString();
              });
              this.props.updateData(this.props.data);
            }
          });
        }}
      >
        {children && <div>{children}</div>}
      </div>
    );
  }

  public render() {
    const root = this.props.data.gff3.struct[0];
    return (
      <div
        className="screen"
        style={{ flex: 1, margin: 4, position: 'relative', zoom }}
        onClick={() => this.props.updateSelected(undefined)}
      >
        {this.makeNode(root)}
      </div>
    );
  }
}
