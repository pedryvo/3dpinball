# Development Plan: 3-D Ultra Pinball Web Port

Porting Dynamix / Sierra On-Line's 1995 classic *3-D Ultra Pinball* to the modern Web using WebAssembly, TypeScript, HTML5 Canvas, and Web Audio API.

## Phases

### Phase 1: Reverse Engineering & Binary Extraction (Completed)
- [x] Analyze Clickteam Install Creator installer (`3D Ultra Pinball1.exe`, `sha256: 9c58e1d58e65...`) with REA MCP & Ghidra (`FUN_0040702a`, `FUN_004097ba`, `FUN_004091c4`) to reverse-engineer the custom 4-bit header DEFLATE compression and extract all 29 original files.
- [x] Analyze `PINBALL.EXE` (`sha256: 4e675a78ba3a...`) with REA MCP & Ghidra (1,863 procedures, 99 external Win32 imports, Borland C++ RTTI classes, and original source file assertions).
- [x] Document exported Window/Dialog procedures (`re/window_procs.json`) and binary architecture (`re/binary_analysis.json`).
- [x] Reverse-engineer `RESOURCE.MAP`, `RESOURCE.001`, and `RESOURCE.002` volume formats (`docs/formats/resource_map.md`).
- [x] Reverse-engineer `BMP:`, `RIFF PAL`, `ANM:`, `ITF:`, `MAP:`/`.TBL`, `TEXT.RES`, and `CREDITS.RES` chunk formats.

### Phase 2: Asset Extraction & Binary Parsers (Completed)
- [x] Extract authentic 256-color palettes (`OUTPOST.PAL`, `CP.PAL`, `MINE.PAL`, `SCORE.PAL`, `SHELL.PAL`, `LOGO.PAL`) and 640×480 table bitmaps (`OUTPOSTJ.BMP`, `CPJ.BMP`, `MINEJ.BMP`, `LOGO.BMP`, `SIERRA.BMP`, `BALLS.BMP`) into `public/assets/`.
- [x] Extract authentic PCM `.WAV` sound effects (`FLIPPER.WAV`, `KACHUNK1..9.WAV`, `ZAP1..4.WAV`, `EXPLO1..3.WAV`, `FANFARE1..4.WAV`, `VICTORY1.WAV`, `LOSE1.WAV`, `CRYSTAL1.WAV`, `ROLL1.WAV`, etc.) into `public/sfx/`.
- [x] Build TypeScript binary parsers for Dynamix `BMP:`, `RIFF PAL`, `TBL`, and `RES` chunks (`src/archive/`).

### Phase 3: WebAssembly Physics & Simulation Core (Completed)
- [x] Compile native WebAssembly rigid-body & spline pinball physics module (`src/physics/wasm-physics.ts`) running 8 sub-steps per 60Hz frame (480Hz integration).
- [x] Implement circle-segment, circle-arc, ramp spline (`PB_SPLIN.C`), bumper restitution, kicker impulse, slingshot, and dual/triple flipper angular collision (`PB_COL.C`).
- [x] Implement authentic table geometries, targets, ramps, ball locks, multiball, and mission progression across all 3 tables:
  1. **Colony (Outpost)** — Build Space Port, Lab, Operations Center, Energy Gems, Orbit Hurry-Up, Super Glide.
  2. **Command Post** — Discovery, Supply, Energy, Breach, Alert, Evacuation, and Repair Challenges.
  3. **Mine** — Blasting, Motherlode Jackpot, Right Mine Shaft, Crystal Targets, and 3-Ball Multi-Ball.

### Phase 4: 256-Color Playfield & Dot-Matrix LED Renderer (Completed)
- [x] Render authentic 640×480 256-color table backgrounds (`OUTPOSTJ`, `CPJ`, `MINEJ`) with dynamic light/target overlays, animated bumpers, flippers, and multi-ball trails.
- [x] Render authentic Sierra dot-matrix LED scoreboard HUD with localized scrolling callouts from `TEXT.RES`.

### Phase 5: HTML5 Native UI, Audio & Mobile Touch Controls (Completed)
- [x] Windows 95 / Space Outpost tactical window chrome with accessible HTML5 menus (**Game**, **Options**, **Table**, **Language**, **Help**).
- [x] Interactive modals for Table Picker, High Scores (`HISCORES.DAT`), Preferences (`PBPREFS.CFG`), Controls (`KEYS.ITF`), and Credits (`CREDITS.RES`).
- [x] Web Audio API sound effects & procedural FM/MIDI space soundtrack synthesizer (`src/audio/audio-manager.ts`).
- [x] Mobile-friendly touch controls (Left/Right Flippers, Hold-and-Release Plunger, Nudge Left/Right/Up).

### Phase 6: Full 6-Language Localization (i18n) & Vercel Polish (Completed)
- [x] Complete localization in **Português do Brasil (pt-BR)**, **English (en)**, **Español (es)**, **Русский (ru)**, **简体中文 (zh-CN)**, and **Deutsch (de)**.
- [x] Automated regression test suite (`tests/regressions.mjs`) and Vite production build (`npm run build`).
