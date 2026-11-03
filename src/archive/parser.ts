import type {
  DynamixBitmap,
  DynamixBitmapFrame,
  DynamixPalette,
  DynamixTableMap,
  PaletteEntry,
} from './types';

/**
 * Parses a 1,048-byte RIFF PAL resource (GFXPalette) from RESOURCE.001.
 * Header: "RIFF" + uint32 size + "PAL data" + uint32 dataSize + uint16 ver + uint16 count (256)
 */
export function parseDynamixPalette(buffer: ArrayBuffer | Uint8Array): DynamixPalette {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (riff !== 'RIFF') {
    throw new Error(`Invalid PAL header: expected RIFF, got ${riff}`);
  }

  const version = view.getUint16(20, true);
  const count = Math.min(256, view.getUint16(22, true));
  const entries: PaletteEntry[] = new Array(256);
  const rgba32 = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    if (i < count && 24 + i * 4 + 3 < bytes.byteLength) {
      const off = 24 + i * 4;
      const r = bytes[off];
      const g = bytes[off + 1];
      const b = bytes[off + 2];
      const flags = bytes[off + 3];
      entries[i] = { r, g, b, flags };
      // Little-endian ABGR for ImageData Uint32Array view
      rgba32[i] = (0xff << 24) | (b << 16) | (g << 8) | r;
    } else {
      entries[i] = { r: 0, g: 0, b: 0, flags: 0 };
      rgba32[i] = 0xff000000;
    }
  }

  // Ensure index 0 is black and index 255 is white (Windows system palette convention)
  entries[0] = { r: 0, g: 0, b: 0, flags: 0 };
  rgba32[0] = 0xff000000;
  if (entries[255].r === 0 && entries[255].g === 0 && entries[255].b === 0) {
    entries[255] = { r: 255, g: 255, b: 255, flags: 0 };
    rgba32[255] = 0xffffffff;
  }

  return { version, entries, rgba32 };
}

/**
 * Parses a Dynamix "BMP:" chunk (GFXBitmap / GFXBitmapArray) from RESOURCE.001.
 * Structure verified via REA on PINBALL.EXE (TS_FILE.C / GFXBitmap):
 * - 0x00..0x04: "BMP:"
 * - 0x04..0x08: uint32 chunkSize
 * - 0x08..0x0A: uint16 version (1000)
 * - 0x0A..0x0C: uint16 frameCount
 * - 0x0C..0x0C + 4*frameCount: uint32 frameOffsets[frameCount] (from start of BMP: chunk)
 * - At each frameOffset:
 *     uint16 width, uint16 height, uint8 flags, uint32 dataLen, uint8 pixels[dataLen]
 */
export function parseDynamixBitmap(buffer: ArrayBuffer | Uint8Array): DynamixBitmap {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== 'BMP:') {
    throw new Error(`Invalid Dynamix bitmap magic: expected BMP:, got ${magic}`);
  }

  const version = view.getUint16(8, true);
  const frameCount = view.getUint16(10, true);
  const frames: DynamixBitmapFrame[] = [];

  for (let i = 0; i < frameCount; i++) {
    const offPos = 12 + i * 4;
    if (offPos + 4 > bytes.byteLength) break;
    const frameOffset = view.getUint32(offPos, true);
    if (frameOffset + 9 > bytes.byteLength) break;

    const width = view.getUint16(frameOffset, true);
    const height = view.getUint16(frameOffset + 2, true);
    const flags = bytes[frameOffset + 4];
    const dataLen = view.getUint32(frameOffset + 5, true);
    const pixStart = frameOffset + 9;
    const pixEnd = Math.min(bytes.byteLength, pixStart + dataLen);

    const pixels = bytes.subarray(pixStart, pixEnd);
    frames.push({
      index: i,
      width,
      height,
      flags,
      pixels,
    });
  }

  return { version, frameCount: frames.length, frames };
}

/**
 * Parses a Dynamix .TBL / .TBM file ("MAP:", "APP:", "DAT:" chunks)
 */
export function parseDynamixTableMap(buffer: ArrayBuffer | Uint8Array): DynamixTableMap {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== 'MAP:') {
    throw new Error(`Invalid TBL header: expected MAP:, got ${magic}`);
  }

  const mapSize = view.getUint32(4, true);
  const count = view.getUint32(8, true);
  const identifiers: string[] = [];

  const strBase = 12 + count * 2;
  for (let i = 0; i < count; i++) {
    const relOff = view.getUint16(12 + i * 2, true);
    let pos = strBase + relOff;
    let s = '';
    while (pos < 8 + mapSize && pos < bytes.byteLength && bytes[pos] !== 0) {
      s += String.fromCharCode(bytes[pos]);
      pos++;
    }
    if (s) identifiers.push(s);
  }

  let appHeaderSize = 0;
  let datPayloadSize = 0;
  let cursor = 8 + mapSize;
  while (cursor + 8 <= bytes.byteLength) {
    const tag = String.fromCharCode(
      bytes[cursor],
      bytes[cursor + 1],
      bytes[cursor + 2],
      bytes[cursor + 3]
    );
    const sz = view.getUint32(cursor + 4, true) & 0x7fffffff;
    if (tag === 'APP:') appHeaderSize = sz;
    if (tag === 'DAT:') datPayloadSize = sz;
    cursor += 8 + sz;
  }

  return {
    tableName: identifiers[0] ?? 'unknown',
    identifiers,
    appHeaderSize,
    datPayloadSize,
  };
}

/**
 * Parses CRLF-delimited TEXT.RES or CREDITS.RES resource strings.
 */
export function parseTextResource(buffer: ArrayBuffer | Uint8Array): string[] {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const decoder = new TextDecoder('windows-1252');
  const raw = decoder.decode(bytes);
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
