# Dynamix `RESOURCE.MAP` & `RESOURCE.001` / `RESOURCE.002` Format Specification

Reverse-engineered from `PINBALL.EXE` (`StreamIO`, `FileRStream`, `TS_FILE.C`) and verified against `RESOURCE.MAP` (3,268 bytes), `RESOURCE.001` (10,564,714 bytes), and `RESOURCE.002` (10,123,435 bytes).

## 1. `RESOURCE.MAP` Directory Structure

| Offset | Type | Field | Description |
|---|---|---|---|
| `0x00` | `uint32` | `signature` | Version/header magic (`0x07060100`) |
| `0x04` | `uint16` | `volumeCount` | Number of volume files (`2`: `RESOURCE.001`, `RESOURCE.002`) |
| `0x06` | `Volume[]` | `volumes` | Sequential volume directory tables |

Each `Volume` block consists of:
1. `volumeName`: Null-terminated ASCII string (`"RESOURCE.001\0"`, `"RESOURCE.002\0"`).
2. `entryCount`: `uint16` little-endian count (`181` for `RESOURCE.001`, `223` for `RESOURCE.002`).
3. `entries[entryCount]`: Array of 8-byte records:
   - `uint32 hash`: Case-insensitive filename hash.
   - `uint32 offset`: Byte offset of the entry inside the volume file.

## 2. Volume Entry Header (`RESOURCE.001` / `RESOURCE.002`)

At each `offset` inside `RESOURCE.001` or `RESOURCE.002`:

| Offset | Size | Type | Description |
|---|---|---|---|
| `+0x00` | `13` | `char[13]` | Null-terminated 8.3 DOS filename (e.g. `"OUTPOSTJ.BMP\0"`) |
| `+0x0D` | `4` | `uint32` | Payload byte length (`dataSize`) |
| `+0x11` | `dataSize` | `uint8[]` | Raw resource payload |

## 3. Inner Chunk Formats

### 3.1 `BMP:` (`GFXBitmap` / `GFXBitmapArray`)
Used by all table playfields (`OUTPOSTJ.BMP`, `CPJ.BMP`, `MINEJ.BMP` — `640×480` 8-bit indexed) and sprite sheets (`BALLS.BMP`, `OUTPOST1..4.BMP`, etc.):
- `0x00..0x04`: `"BMP:"`
- `0x04..0x08`: `uint32 chunkSize` (`totalSize - 8`)
- `0x08..0x0A`: `uint16 version` (`0x03E8` = 1000)
- `0x0A..0x0C`: `uint16 frameCount`
- `0x0C..0x0C + 4*frameCount`: `uint32 frameOffsets[frameCount]` (relative to offset `0x08`)
- At each `0x08 + frameOffsets[i]`:
  - `uint16 width`
  - `uint16 height`
  - `uint8 compressionFlags` (`0x00` = raw uncompressed `width * height` 8-bit indices)
  - `uint32 pixelDataSize`
  - `uint8 pixels[pixelDataSize]`

### 3.2 `RIFF PAL` (`GFXPalette`)
Used by `OUTPOST.PAL`, `CP.PAL`, `MINE.PAL`, `SCORE.PAL`, `SHELL.PAL`, `LOGO.PAL`, `SIERRA.PAL` (1,048 bytes):
- `0x00..0x18`: Microsoft RIFF `PAL data` header (`version = 0x0300`, `entries = 256`)
- `0x18..0x418`: 256 × 4-byte `(R, G, B, flags)` palette entries.

### 3.3 `MAP:` / `APP:` / `DAT:` (`.TBL` and `.TBM`)
Used by `OUTPOST.TBL`, `CP.TBL`, `MINE.TBL`, `B1.TBL`, `B3.TBL`:
- `MAP:`: Offset table and null-terminated entity identifiers (`outpost`, `l1_flip1`, `r1_flip1`, etc.).
- `APP:`: Table metadata (308 bytes).
- `DAT:`: Serialized collision primitives, splines, flippers, bumpers, and target definitions read by `PB_BIN.C`.
