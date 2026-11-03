# Reverse Engineering & Fidelity Audit (`3dpinball`)

## 1. Installer Decompression (`3D Ultra Pinball1.exe`)
- **Target**: `3D Ultra Pinball1.exe` (`sha256: 9c58e1d58e65395938cfc7696bf6fb634d03c46a70e0560dd6822df650c01ed4`)
- **REA Evidence**:
  - `ev_cf9ff84455dee7b90885045b6e314994814888fd0cf2c9091d63501910eb4652` (`binary_overview`)
  - `ev_bf0f0b5bc25ca1eaab40be7352a3b82ac0bcb3236be43a82f198d2a4ddec2dc4` (`FUN_0040702a` archive chunk reader)
  - `ev_fe26eacf36785f007facd55c079e9570034bb3699c7278114da8e835b1c2270d` (`FUN_004097ba` custom 4-bit block header dispatcher)
  - `ev_89bb0447e35ad31133bff7eafd9ba26eba762f0cfb6e85dceb7cc3526ea93902` (`FUN_004091c4` dynamic Huffman tree builder)
- **Findings**:
  - The installer is a Clickteam Install Creator stub whose archive starts at file offset `0x13000`.
  - Chunk `0x123a` (`0x198ec`) stores 29 file records; chunk `0x7f7f` (`0x19da7`) stores the compressed streams.
  - Each stream uses a modified DEFLATE bitstream where each block begins with a 4-bit header: `btype = hdr & 7` (`5` = fixed Huffman, `6` = dynamic Huffman, `7` = stored 16-bit length without `NLEN`) and `bfinal = (hdr >> 3) & 1`.

## 2. Main Executable Analysis (`PINBALL.EXE`)
- **Target**: `PINBALL.EXE` (`sha256: 4e675a78ba3aa5dc11d5f85f494e4beaefc7f2ea7b85f5f0ab9dc6264946696b`)
- **REA Evidence**:
  - `ev_5446da8be93a9152bb0f83bd3925d07cd1ee3b767f6835d2b9fd65d519e149ce` (`binary_overview`)
  - `ev_d99f044d354d6db8316c543c1a5769ce9606c0beaaf62624da9ff2b95868cdd0` (`list_procedures`: 1,863 functions)
  - `ev_ba6b631e0a07db0ffe875467d841b03555210efac7fab7367cc0843872ab44be` (`@mainWndProc$qpvuiuil` decompilation)
  - `ev_61df49508d6acc147b6248cfdfa36408f4faedbe4567c5b9337fe67f804a9866` (`@pinWndProc$qpvuiuil` decompilation)
  - `ev_5d923940a4d443ccd47a86bb280d003eb250aa34182f0193a416a1c94fab9df2` & `ev_5b7ee4611ddba5abd884ff6d5eea4391f9dba31887c1f381365403ae536d2181` (`FUN_00454bf8` sole caller of `GDI32.DLL::CreateDIBSection`)
- **Findings**:
  - Rendering is 100% 8-bit palettized software rendering (`640×480`) through `GFXDevWinG` / `CreateDIBSection` (`0x454bf8`).
  - Input handling in `@mainWndProc$qpvuiuil` (`0x428ec9`) processes `WM_KEYDOWN` (`0x100`), `WM_LBUTTONDOWN` (`0x201`), and `WM_RBUTTONDOWN` (`0x204`), dispatching left flipper (`FUN_00428dd1`), right flipper (`FUN_00428e26`), and table bump/tilt (`FUN_00428e7b` with tilt threshold counter `DAT_0046f1a4` < 4 before triggering `...TILT...TILT...TILT...`).
