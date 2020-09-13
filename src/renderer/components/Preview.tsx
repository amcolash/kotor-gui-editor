import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import React, { createRef, CSSProperties, Fragment } from 'react';
import { tmpDir } from './App';

interface PreviewProps {
  data: any; // TODO Typedefs
  selected?: any;
  updateData: (data: any, cb: () => void) => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
  updateSelected: (data: any) => void;
}

interface PreviewState {
  zoom: number;
}

export default class Preview extends React.Component<PreviewProps, PreviewState> {
  state: PreviewState = {
    zoom: 1,
  };

  totalWidth: number = 0;
  totalHeight: number = 0;
  coords = { x: 0, y: 0 };

  imageCache: { [key: string]: string } = {};
  dragImageCache: { [key: string]: HTMLImageElement } = {};

  rootRef: React.RefObject<HTMLDivElement> = createRef();

  public componentDidMount() {
    const ro = new ResizeObserver(this.updateZoom);
    if (this.rootRef?.current) ro.observe(this.rootRef.current);
  }

  private updateZoom = () => {
    if (this.rootRef?.current) {
      const bounds = this.rootRef.current.getBoundingClientRect();
      const padding = parseInt(this.rootRef.current.style.padding);

      const ratioWidth = (bounds.width - padding * 2) / this.totalWidth;
      const ratioHeight = (bounds.height - padding * 2) / this.totalHeight;

      this.setState({ zoom: Math.min(ratioWidth, ratioHeight) });
    }
  };

  private makeNode(data: any): JSX.Element {
    let label: string = '';
    if (data.exostring) {
      if (data.exostring.label === 'TAG') label = data.exostring.$t;
      else if (Array.isArray(data.exostring)) {
        data.exostring.forEach((e: any) => {
          if (e.label === 'TAG') label += e.$t;
          if (e.label === 'Obj_Parent') label += e.$t;
        });
      }
    }

    // Children are true child elements, pseudoChildren are nested structs like PROTOITEM/SCROLLBAR
    // It matters for proper preview layout (nested or sibling in DOM)
    const children: JSX.Element[] = [];
    const pseudoChildren: JSX.Element[] = [];

    const style: CSSProperties = {};
    let width: number = 0;
    let height: number = 0;

    if (data.struct) {
      data.struct.forEach((s: any) => {
        if (s.label === 'EXTENT') {
          style.position = 'absolute';

          if (this.props.selected === data) {
            style.outline = '6px solid lime';
            style.outlineOffset = -6;
          } else {
            style.outline = '1px solid #555';
            style.outlineOffset = -1;
          }

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

          this.totalWidth = Math.max(this.totalWidth, (style.left as number) + (style.width as number));
          this.totalHeight = Math.max(this.totalHeight, (style.top as number) + (style.height as number));
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
                if (!this.imageCache[img]) {
                  try {
                    if (existsSync(img)) {
                      // Meh on perf here, but it should usually be a reasonably small amount of images
                      const buf = readFileSync(img);
                      this.imageCache[img] = 'data:image/png;base64,' + buf.toString('base64');
                      style.backgroundImage = `url(${this.imageCache[img]})`;
                    } else {
                      this.imageCache[img] = 'error';
                    }
                  } catch (e) {
                    console.error(e);
                    if (!this.imageCache[img]) this.imageCache[img] = 'error';
                  }
                } else if (this.imageCache[img] !== 'error') {
                  style.backgroundImage = `url(${this.imageCache[img]})`;
                }
              }
            });
          }

          if (style) {
            const w = Math.floor(width * this.state.zoom);
            const h = Math.floor(height * this.state.zoom);

            const found = this.dragImageCache[label];
            if (found && found.width === w && found.height === h) return;

            const canvas = document.createElement('canvas');
            const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;

            canvas.width = w;
            canvas.height = h;

            // There is some dupe code below, callbacks and events are hard and just not worth it to deal with
            if (img && this.imageCache[img]) {
              const image = document.createElement('img');
              image.src = this.imageCache[img];
              image.onload = (e) => {
                ctx.drawImage(e.target as HTMLImageElement, 0, 0, canvas.width, canvas.height);

                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'lime';
                ctx.rect(0, 0, w, h);
                ctx.stroke();
                ctx.closePath();
                ctx.fillStyle = 'rgba(0,255,0,0.2)';
                ctx.fillRect(0, 0, w, h);

                const image = document.createElement('img');
                image.src = canvas.toDataURL();
                image.onload = (e) => {
                  this.dragImageCache[label] = e.target as HTMLImageElement;
                };
              };
            } else {
              ctx.beginPath();
              ctx.lineWidth = 4;
              ctx.strokeStyle = 'lime';
              ctx.rect(0, 0, w, h);
              ctx.stroke();
              ctx.closePath();
              ctx.fillStyle = 'rgba(0,255,0,0.2)';
              ctx.fillRect(0, 0, w, h);

              const image = document.createElement('img');
              image.src = canvas.toDataURL();
              image.onload = (e) => {
                this.dragImageCache[label] = e.target as HTMLImageElement;
              };
            }
          }
        } else if (s.label === 'PROTOITEM' || s.label === 'SCROLLBAR') {
          pseudoChildren.push(this.makeNode(s));
        }
      });
    }

    if (data.list && data.list.struct) {
      data.list.struct.forEach((e: any) => {
        children.push(this.makeNode(e));
      });
    }

    return (
      <Fragment key={label}>
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

            this.coords.x = e.clientX;
            this.coords.y = e.clientY;

            const bounds = (e.target as HTMLElement).getBoundingClientRect();
            const offsetX = e.clientX - bounds.left * this.state.zoom;
            const offsetY = e.clientY - bounds.top * this.state.zoom;

            e.dataTransfer.setDragImage(this.dragImageCache[label], offsetX, offsetY);
          }}
          onDragEnd={(e) => {
            if (data !== this.props.selected) return;

            const diffX = (this.coords.x - e.clientX) / this.state.zoom;
            const diffY = (this.coords.y - e.clientY) / this.state.zoom;

            data.struct.forEach((s: any) => {
              if (s.label === 'EXTENT') {
                s.sint32.forEach((s: any) => {
                  if (s.label === 'TOP') s.$t = Math.floor(parseInt(s.$t) - diffY).toString();
                  if (s.label === 'LEFT') s.$t = Math.floor(parseInt(s.$t) - diffX).toString();
                });
                this.props.updateData(this.props.data, () => {
                  this.updateZoom();
                });
              }
            });
          }}
        >
          {children}
        </div>

        {pseudoChildren}
      </Fragment>
    );
  }

  public render() {
    if (!this.props.data) return null;

    // Reset size before it is calculated by making children
    this.totalWidth = 1;
    this.totalHeight = 1;

    const root = this.props.data.gff3.struct[0];
    return (
      <div
        className="preview"
        style={{ flex: 1, margin: '0 8px', overflow: 'hidden', padding: 2 }}
        onMouseDown={(e) => this.props.updateSelected(undefined)}
        ref={this.rootRef}
      >
        <div style={{ zoom: this.state.zoom, position: 'relative' }}>{this.makeNode(root)}</div>
      </div>
    );
  }
}
