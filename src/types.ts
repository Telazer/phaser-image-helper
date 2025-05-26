type IMAGE_GRID = [number, number];

export type IMAGE_SLICE = {
  pos: [number, number] | [number] | number;
  grid?: IMAGE_GRID;
};

export type IMAGE_RECT = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type IMAGE_NINE_SLICE = {
  topHeight: number;
  centerHeight: number;
  bottomHeight: number;
  leftWidth: number;
  centerWidth: number;
  rightWidth: number;
  pixelated?: boolean;
  fill?: "repeat" | "stretch";
  scale?: string;
};

export interface IMAGE_NINE_SLICE_DATA extends IMAGE_NINE_SLICE {
  src: string[];
}

export interface IMAGE_DATA {
  key: string;
  url: string;
  extruded?: string;
  normal?: string;
  grid?: IMAGE_GRID;
  nineSlice?: IMAGE_NINE_SLICE;
  parse?: {
    key: string;
    slice?: IMAGE_SLICE;
    rect?: IMAGE_RECT;
    nineSlice?: IMAGE_NINE_SLICE | boolean;
  }[];
}
