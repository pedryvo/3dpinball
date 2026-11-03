export interface PaletteEntry {
  r: number;
  g: number;
  b: number;
  flags: number;
}

export interface DynamixPalette {
  version: number;
  entries: PaletteEntry[];
  /** Packed ABGR uint32 lookup table for fast ImageData 32-bit writes */
  rgba32: Uint32Array;
}

export interface DynamixBitmapFrame {
  index: number;
  width: number;
  height: number;
  flags: number;
  pixels: Uint8Array;
}

export interface DynamixBitmap {
  version: number;
  frameCount: number;
  frames: DynamixBitmapFrame[];
}

export interface DynamixTableMap {
  tableName: string;
  identifiers: string[];
  appHeaderSize: number;
  datPayloadSize: number;
}

export interface DynamixAnimationFrame {
  frameIndex: number;
  durationMs: number;
  xOffset: number;
  yOffset: number;
}

export interface DynamixAnimation {
  name: string;
  frameCount: number;
  frames: DynamixAnimationFrame[];
}
