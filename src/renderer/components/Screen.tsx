import { readFileSync } from 'fs';
import { join } from 'path';
import React, { CSSProperties } from 'react';
import { ZoomIn, ZoomOut } from 'react-feather';
import { style } from 'typestyle';
import { tmpDir } from './App';

const imageCache: { [key: string]: string } = {};
const dragImageCache: { [key: string]: HTMLImageElement } = {};

let coords = { x: 0, y: 0 };

const iconClass = style({
  margin: 4,
  padding: 4,
  borderRadius: 4,
  cursor: 'pointer',

  $nest: {
    '&:hover': {
      background: '#eee',
    },
  },
});

interface ScreenProps {
  data: any; // TODO Typedefs
  selected?: any;
  updateData: (data: any) => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
  updateSelected: (data: any) => void;
}

interface ScreenState {
  zoom: number;
}

export default class Screen extends React.Component<ScreenProps, ScreenState> {
  state: ScreenState = {
    zoom: 0.6,
  };

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
    let width: number = 0;
    let height: number = 0;

    if (data.struct) {
      data.struct.forEach((s: any) => {
        if (s.label === 'EXTENT') {
          style.border = '1px solid #555';
          style.position = 'absolute';
          if (this.props.selected === data) style.outline = '2px solid lime';
          s.sint32.forEach((s: any) => {
            if (s.label === 'TOP') style.top = parseInt(s.$t);
            if (s.label === 'LEFT') style.left = parseInt(s.$t);
            if (s.label === 'WIDTH') {
              style.width = parseInt(s.$t);
              width = style.width;
            }
            if (s.label === 'HEIGHT') {
              style.height = parseInt(s.$t);
              height = style.height;
            }
          });
        } else if (s.label === 'BORDER') {
          let showImg = false;
          s.sint32.forEach((s: any) => {
            if (s.label === 'FILLSTYLE' && s.$t === '2') showImg = true;
          });

          let img;
          if (showImg) {
            s.resref.forEach((s: any) => {
              if (s.label === 'FILL' && s.$t) {
                style.backgroundRepeat = 'no-repeat';
                style.backgroundSize = `${width}px ${height}px`;

                img = join(tmpDir, 'pngs', s.$t + '.png');
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

          if (style) {
            const w = Math.floor(width * this.state.zoom);
            const h = Math.floor(height * this.state.zoom);

            const found = dragImageCache[label];
            if (found && found.width === w && found.height === h) return;

            const canvas = document.createElement('canvas');
            const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'lime';

            canvas.width = w;
            canvas.height = h;

            // There is some dupe code below, callbacks and events are hard and just not worth it to deal with
            if (img && imageCache[img]) {
              const image = document.createElement('img');
              image.src = imageCache[img];
              image.onload = (e) => {
                ctx.drawImage(e.target as HTMLImageElement, 0, 0, canvas.width, canvas.height);

                ctx.beginPath();
                ctx.rect(0, 0, w, h);
                ctx.stroke();

                const image = document.createElement('img');
                image.src = canvas.toDataURL();
                image.onload = (e) => {
                  dragImageCache[label] = e.target as HTMLImageElement;
                };
              };
            } else {
              ctx.beginPath();
              ctx.rect(0, 0, w, h);
              ctx.stroke();

              const image = document.createElement('img');
              image.src = canvas.toDataURL();
              image.onload = (e) => {
                dragImageCache[label] = e.target as HTMLImageElement;
              };
            }
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
        onMouseDown={(e) => {
          e.stopPropagation();
          if (data !== this.props.selected) this.props.updateSelected(data);
        }}
        style={style}
        key={label}
        id={label}
        draggable={data === this.props.selected}
        onDragStart={(e) => {
          // console.log(e.target);

          if (data !== this.props.selected) return;

          coords.x = e.clientX;
          coords.y = e.clientY;

          let label: string = '';
          if (data.exostring) {
            if (data.exostring.label === 'TAG') label = data.exostring.$t;
            else if (Array.isArray(data.exostring)) {
              data.exostring.forEach((e: any) => {
                if (e.label === 'TAG') label = e.$t;
              });
            }
          }

          const bounds = (e.target as HTMLElement).getBoundingClientRect();
          const offsetX = e.clientX - bounds.left * this.state.zoom;
          const offsetY = e.clientY - bounds.top * this.state.zoom;

          // console.log(bounds, offsetX, offsetY, e.clientX, e.clientY);

          e.dataTransfer.setDragImage(dragImageCache[label], offsetX, offsetY);
        }}
        onDragEnd={(e) => {
          if (data !== this.props.selected) return;

          const diffX = (coords.x - e.clientX) / this.state.zoom;
          const diffY = (coords.y - e.clientY) / this.state.zoom;

          // console.log(diffX, diffY);

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
        style={{ flex: 1, margin: 4, position: 'relative', overflow: 'hidden' }}
        onMouseDown={() => this.props.updateSelected(undefined)}
      >
        <div style={{ zoom: this.state.zoom }}>{this.makeNode(root)}</div>
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            padding: 5,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            border: '1px solid #ccc',
          }}
        >
          <ZoomOut size="20" className={iconClass} onClick={() => this.setState({ zoom: this.state.zoom -= 0.1 })} />
          <ZoomIn size="20" className={iconClass} onClick={() => this.setState({ zoom: this.state.zoom += 0.1 })} />
        </div>
      </div>
    );
  }
}
