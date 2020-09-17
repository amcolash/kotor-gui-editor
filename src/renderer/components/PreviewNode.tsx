import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import React, { CSSProperties, Fragment } from 'react';
import { style } from 'typestyle';
import { lightSelection, os, previewDarkSelection } from '../util/Consts';
import { tmpDir } from './App';
import { PreviewData } from './Preview';

const handleSize = os === 'win' ? 10 : 20;
const handleClass = style({
  minWidth: handleSize,
  minHeight: handleSize,
  maxWidth: handleSize,
  maxHeight: handleSize,
  position: 'absolute',
});

const horizontalClass = style({
  $nest: {
    '&:hover': {
      cursor: 'ew-resize',
    },
  },
});

const verticalClass = style({
  $nest: {
    '&:hover': {
      cursor: 'ns-resize',
    },
  },
});

// Apparently there is some weird dpi stuff w/ windows
const outlineWidth = os === 'win' ? 3 : 6;
const selectionWidth = os === 'win' ? 2 : 4;

interface PreviewNodeProps {
  data: any;
  label: string;
  selected: any;
  updateData: () => void;
  updateSelected: (data: any) => void;
  pseudoChildren: JSX.Element[];
  previewData: PreviewData;
  zoom: number;
  darkMode: boolean;
}

export default class PreviewNode extends React.Component<PreviewNodeProps> {
  render() {
    const { data, label, previewData, selected, zoom } = this.props;
    const { dragImageCache, imageCache } = previewData;

    const style: CSSProperties = {};
    let width: number = 0;
    let height: number = 0;

    if (data.struct) {
      data.struct.forEach((s: any) => {
        if (s.label === 'EXTENT') {
          style.position = 'absolute';

          if (selected === data) {
            style.outline = `${outlineWidth}px solid ${this.props.darkMode ? previewDarkSelection : lightSelection}`;
            style.outlineOffset = -6;
            style.zIndex = 1;
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

          previewData.totalWidth = Math.max(previewData.totalWidth, (style.left as number) + (style.width as number));
          previewData.totalHeight = Math.max(previewData.totalHeight, (style.top as number) + (style.height as number));
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

                img = join(tmpDir, 'png', s.$t + '.png');
                if (!this.props.previewData.imageCache[img]) {
                  try {
                    if (existsSync(img)) {
                      // Meh on perf here, but it should usually be a reasonably small amount of images
                      const buf = readFileSync(img);
                      imageCache[img] = 'data:image/png;base64,' + buf.toString('base64');
                      style.backgroundImage = `url(${imageCache[img]})`;
                    }
                  } catch (e) {
                    console.error(e);
                    imageCache[img] = 'error';
                  }
                } else if (imageCache[img] !== 'error') {
                  style.backgroundImage = `url(${imageCache[img]})`;
                }
              }
            });
          }

          const w = Math.floor(width * zoom);
          const h = Math.floor(height * zoom);

          const found = dragImageCache[label];
          if (found && found.width === w && found.height === h) return;

          const canvas = document.createElement('canvas');
          const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;

          canvas.width = w;
          canvas.height = h;

          // Shared logic for generating preview, needed since there are annoying callbacks from image loading
          const generatePreview = () => {
            ctx.beginPath();
            ctx.lineWidth = selectionWidth;
            ctx.strokeStyle = this.props.darkMode ? previewDarkSelection : lightSelection;
            ctx.rect(0, 0, w, h);
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = 'rgba(0,255,0,0.2)';
            ctx.fillRect(0, 0, w, h);

            const image = document.createElement('img');
            image.src = canvas.toDataURL();
            image.onload = (e) => {
              dragImageCache[label] = e.target as HTMLImageElement;
            };
          };

          if (img && imageCache[img]) {
            const image = document.createElement('img');
            image.src = imageCache[img];
            image.onload = (e) => {
              ctx.drawImage(e.target as HTMLImageElement, 0, 0, canvas.width, canvas.height);
              generatePreview();
            };
          } else {
            generatePreview();
          }
        }
      });
    }

    const dragStartHandle = (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation();

      previewData.coords.x = e.clientX;
      previewData.coords.y = e.clientY;

      // No drag image for now
      const img = new Image();
      e.dataTransfer.setDragImage(img, 0, 0);
    };

    const dragEndHandle = (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation();

      const diffX = (previewData.coords.x - e.clientX) / zoom;
      const diffY = (previewData.coords.y - e.clientY) / zoom;

      const isRight = (e.target as HTMLElement).classList.contains('right');
      const isLeft = (e.target as HTMLElement).classList.contains('left');
      const isTop = (e.target as HTMLElement).classList.contains('top');
      const isBottom = (e.target as HTMLElement).classList.contains('bottom');

      data.struct.forEach((s: any) => {
        if (s.label === 'EXTENT') {
          s.sint32.forEach((s: any) => {
            if (s.label === 'LEFT' && isLeft) s.$t = Math.floor(parseInt(s.$t) - diffX).toString();
            if (s.label === 'TOP' && isTop) s.$t = Math.floor(parseInt(s.$t) - diffY).toString();

            if (s.label === 'WIDTH') {
              if (isRight) {
                s.$t = Math.max(1, Math.floor(parseInt(s.$t) - diffX)).toString();
              } else if (isLeft) {
                s.$t = Math.max(1, Math.floor(parseInt(s.$t) + diffX)).toString();
              }
            }

            if (s.label === 'HEIGHT') {
              if (isBottom) {
                s.$t = Math.max(1, Math.floor(parseInt(s.$t) - diffY)).toString();
              } else if (isTop) {
                s.$t = Math.max(1, Math.floor(parseInt(s.$t) + diffY)).toString();
              }
            }
          });

          this.props.updateData();
        }
      });
    };

    return (
      <Fragment key={label}>
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            if (data !== selected) this.props.updateSelected(data);
          }}
          style={style}
          key={label}
          id={label}
          draggable={data === selected}
          onDragStart={(e) => {
            // console.log(e.target);
            if (data !== selected) return;

            previewData.coords.x = e.clientX;
            previewData.coords.y = e.clientY;

            const bounds = (e.target as HTMLElement).getBoundingClientRect();
            const offsetX = e.clientX - bounds.left * zoom;
            const offsetY = e.clientY - bounds.top * zoom;

            e.dataTransfer.setDragImage(dragImageCache[label], offsetX, offsetY);
          }}
          onDragEnd={(e) => {
            if (data !== selected) return;

            const diffX = (previewData.coords.x - e.clientX) / zoom;
            const diffY = (previewData.coords.y - e.clientY) / zoom;

            data.struct.forEach((s: any) => {
              if (s.label === 'EXTENT') {
                s.sint32.forEach((s: any) => {
                  if (s.label === 'TOP') s.$t = Math.floor(parseInt(s.$t) - diffY).toString();
                  if (s.label === 'LEFT') s.$t = Math.floor(parseInt(s.$t) - diffX).toString();
                });
                this.props.updateData();
              }
            });
          }}
        >
          {data === selected && (
            <div className="handles">
              <div
                draggable
                className={`left ${handleClass} ${horizontalClass}`}
                style={{
                  left: -handleSize / 2 + selectionWidth / 2,
                  top: height / 2 - handleSize / 2,
                  background: this.props.darkMode ? previewDarkSelection : lightSelection,
                }}
                onDragStart={dragStartHandle}
                onDragEnd={dragEndHandle}
              />
              <div
                draggable
                className={`right ${handleClass} ${horizontalClass}`}
                style={{
                  right: -handleSize / 2 + selectionWidth / 2,
                  top: height / 2 - handleSize / 2,
                  background: this.props.darkMode ? previewDarkSelection : lightSelection,
                }}
                onDragStart={dragStartHandle}
                onDragEnd={dragEndHandle}
              />
              <div
                draggable
                className={`top ${handleClass} ${verticalClass}`}
                style={{
                  left: width / 2 - handleSize / 2,
                  top: -handleSize / 2 + selectionWidth / 2,
                  background: this.props.darkMode ? previewDarkSelection : lightSelection,
                }}
                onDragStart={dragStartHandle}
                onDragEnd={dragEndHandle}
              />
              <div
                draggable
                className={`bottom ${handleClass} ${verticalClass}`}
                style={{
                  left: width / 2 - handleSize / 2,
                  bottom: -handleSize / 2 + selectionWidth / 2,
                  background: this.props.darkMode ? previewDarkSelection : lightSelection,
                }}
                onDragStart={dragStartHandle}
                onDragEnd={dragEndHandle}
              />
            </div>
          )}
          {this.props.children}
        </div>

        {this.props.pseudoChildren}
      </Fragment>
    );
  }
}
