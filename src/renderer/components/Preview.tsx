import React, { createRef } from 'react';
import { getLabel } from '../util/DataUtil';
import PreviewNode from './PreviewNode';

interface PreviewProps {
  data: GFF;
  selected?: Struct;
  updateData: (data: GFF, cb: () => void) => void; // BAD PRACTICE, BUT IT IS SO MUCH EAISER TO UPDATE NESTED THINGS THIS WAY
  updateSelected: (data?: Struct) => void;
  darkMode: boolean;
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

  public componentDidUpdate() {
    // Update zoom when things actually change - for some reason the prev / current are the same :thinkingface:
    const newZoom = this.calcZoom();
    if (this.state.zoom !== newZoom) this.updateZoom();
  }

  private calcZoom = () => {
    if (this.rootRef?.current) {
      const bounds = this.rootRef.current.getBoundingClientRect();
      const padding = parseInt(this.rootRef.current.style.padding);

      const ratioWidth = (bounds.width - padding * 2) / this.previewData.totalWidth;
      const ratioHeight = (bounds.height - padding * 2) / this.previewData.totalHeight;

      return Math.min(ratioWidth, ratioHeight);
    }

    return this.state.zoom;
  };

  private updateZoom = () => {
    this.setState({ zoom: this.calcZoom() });
  };

  private makeNode(data: Struct): JSX.Element {
    const label = getLabel(data);

    // Children are true child elements
    // It matters for proper preview layout (nested or sibling in DOM)
    const children: JSX.Element[] = [];
    data.list?.struct.forEach((e: Struct) => {
      children.push(this.makeNode(e));
    });

    // pseudoChildren are nested structs like PROTOITEM/SCROLLBAR
    // It matters for proper preview layout (nested or sibling in DOM)
    const pseudoChildren: JSX.Element[] = [];
    data.struct?.forEach((s: Struct) => {
      if (s.label === 'PROTOITEM' || s.label === 'SCROLLBAR') {
        pseudoChildren.push(this.makeNode(s));
      }
    });

    return (
      <PreviewNode
        key={label}
        label={label}
        data={data}
        selected={this.props.selected}
        updateSelected={this.props.updateSelected}
        updateData={() => this.props.updateData(this.props.data, () => this.updateZoom())}
        pseudoChildren={pseudoChildren}
        previewData={this.previewData}
        zoom={this.state.zoom}
        darkMode={this.props.darkMode}
      >
        {children}
      </PreviewNode>
    );
  }

  public render() {
    // Reset size before it is calculated by making children
    this.previewData.totalWidth = 1;
    this.previewData.totalHeight = 1;

    const root = this.props.data.gff3.struct[0];
    if (!root) return null;
    return (
      <div
        className="preview"
        style={{ flex: 1, margin: '0 8px', overflow: 'hidden', padding: 6, filter: this.props.darkMode ? 'invert(1)' : undefined }}
        onMouseDown={(e) => this.props.updateSelected(undefined)}
        ref={this.rootRef}
      >
        <div style={{ zoom: this.state.zoom, position: 'relative' }}>{this.makeNode(root)}</div>
      </div>
    );
  }
}
