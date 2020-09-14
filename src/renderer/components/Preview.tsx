import React, { createRef } from 'react';
import PreviewNode from './PreviewNode';

interface PreviewProps {
  data: any; // TODO Typedefs
  selected?: any;
  updateData: (data: any, cb: () => void) => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
  updateSelected: (data: any) => void;
}

interface PreviewState {
  zoom: number;
}

export interface PreviewData {
  imageCache: { [key: string]: string };
  dragImageCache: { [key: string]: HTMLImageElement };
  totalWidth: number;
  totalHeight: number;
  coords: { x: number; y: number };
}

export default class Preview extends React.Component<PreviewProps, PreviewState> {
  state: PreviewState = {
    zoom: 1,
  };

  previewData: PreviewData = {
    imageCache: {},
    dragImageCache: {},
    totalWidth: 0,
    totalHeight: 0,
    coords: { x: 0, y: 0 },
  };

  rootRef: React.RefObject<HTMLDivElement> = createRef();

  public componentDidMount() {
    const ro = new ResizeObserver(this.updateZoom);
    if (this.rootRef?.current) ro.observe(this.rootRef.current);

    this.previewData.imageCache = {};
    this.previewData.dragImageCache = {};
  }

  private updateZoom = () => {
    if (this.rootRef?.current) {
      const bounds = this.rootRef.current.getBoundingClientRect();
      const padding = parseInt(this.rootRef.current.style.padding);

      const ratioWidth = (bounds.width - padding * 2) / this.previewData.totalWidth;
      const ratioHeight = (bounds.height - padding * 2) / this.previewData.totalHeight;

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

    // Children are true child elements
    // It matters for proper preview layout (nested or sibling in DOM)
    const children: JSX.Element[] = [];
    if (data.list && data.list.struct) {
      data.list.struct.forEach((e: any) => {
        children.push(this.makeNode(e));
      });
    }

    // pseudoChildren are nested structs like PROTOITEM/SCROLLBAR
    // It matters for proper preview layout (nested or sibling in DOM)
    const pseudoChildren: JSX.Element[] = [];
    if (data.struct) {
      data.struct.forEach((s: any) => {
        if (s.label === 'PROTOITEM' || s.label === 'SCROLLBAR') {
          pseudoChildren.push(this.makeNode(s));
        }
      });
    }

    return (
      <PreviewNode
        key={label}
        label={label}
        data={data}
        selected={this.props.selected}
        updateSelected={this.props.updateSelected}
        updateData={this.props.updateData}
        pseudoChildren={pseudoChildren}
        previewData={this.previewData}
        updateZoom={this.updateZoom}
        zoom={this.state.zoom}
      >
        {children}
      </PreviewNode>
    );
  }

  public render() {
    if (!this.props.data) return null;

    // Reset size before it is calculated by making children
    this.previewData.totalWidth = 1;
    this.previewData.totalHeight = 1;

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
