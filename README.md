<div align="center">

# 3dpinball

**Reverse engineering and modern web port (TypeScript, HTML5 Canvas, WebAssembly & Web Audio API) of _3-D Ultra Pinball_ (Dynamix / Sierra On-Line, 1995)**

[![TypeScript](https://img.shields.io/badge/typescript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/webassembly-physics_core-654ff0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Status](https://img.shields.io/badge/status-playable-success)](#-progress)
[![Phase](https://img.shields.io/badge/phase-1_%E2%80%94_reverse_engineering_%26_foundation-blue)](docs/PLAN.md)
[![Platforms](https://img.shields.io/badge/platforms-Web_%7C_Vercel_%7C_Mobile-lightgrey)](#-running-the-game)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)](LICENSE)

_The 1995 Dynamix / Sierra space-outpost pinball classic,<br>re-engineered to run natively in any modern browser, desktop, and mobile phone._

**English** · [Português](README.pt-BR.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [中文](README.zh-CN.md) · [Русский](README.ru.md)

</div>

---

## 🚀 About

**3dpinball** studies the original _3-D Ultra Pinball_ executable (`PINBALL.EXE`), audio subsystem (`SOS9502.DLL`), and chunked resource archives (`RESOURCE.MAP`, `RESOURCE.001`, `RESOURCE.002`) (Dynamix / Sierra On-Line, 1995) using **REA** (Reverse Engineer Anything) and Ghidra to understand every file format, window procedure (`@mainWndProc$qpvuiuil`, `@pinWndProc$qpvuiuil`), Three-Space 2D/Z-buffer renderer (`TS_DRAW.C`, `GFXDevWinG`), and spline/collision physics (`PB_COL.C`, `PB_SPLIN.C`, `PB_FRAME.C`), delivering a modern, clean web implementation.

Unlike heavyweight x86 emulators, this port runs natively in TypeScript, WebAssembly, and HTML5 Canvas with **zero emulation overhead**:

- 🌐 **Modern Space-Outpost Sci-Fi & Win95 HUD**: Authentic retro Windows 95 window chrome combined with an immersive space-colony tactical dashboard (live LED dot-matrix score display, multiplier telemetry, mission objectives across **Colony**, **Command Post**, and **Mine** tables, and accessible HTML5 menu commands).
- 📱 **Mobile-Friendly & Touch-Ready**: Responsive layout optimized for smartphones and tablets, featuring dedicated on-screen touch Flipper buttons (Left/Right), spring-loaded Plunger launch control, and Nudge/Tilt triggers.
- 🎨 **Pixel-Perfect 256-Color Graphics & Z-Buffer**: Real-time decoding of Dynamix palettes (`.PAL`), bitmaps (`.BMP`), animations (`.ANM`), and interface layouts (`.ITF`) from `RESOURCE.MAP` / `RESOURCE.001` / `RESOURCE.002` using the authentic 8-bit indexed color pipeline (`GFXPalette`, `GFXZBuffer`).
- ⚙️ **WebAssembly Rigid-Body & Spline Physics**: High-frequency sub-step ball physics, flipper angular impulse, bumper restitution, ramp splines (`PB_SPLIN.C`), and collision masks (`PB_COL.C`).
- 🔊 **Web Audio Sound & Synthesizer Music**: Direct playback of original PCM `.WAV` sound effects (`SX_%04d.WAV`) and synthesized FM/MIDI soundtracks (`SX_%04d.MID`) using Web Audio API.
- 🌍 **Full 6-Language Localization (i18n)**: Automatically launches in the user's native regional language (**Português do Brasil**, **English**, **Español**, **Русский**, **简体中文**, and **Deutsch**) with live on-the-fly language switching for all menus, dialogs, mission targets, and table callouts.
- ⚡ **Instant Vercel Deployment**: Ultra-fast Vite build ready for deployment to Vercel, GitHub Pages, or any modern edge hosting.

---

## 📊 Progress

| Area | Status | Details |
|---|:---:|---|
| **Plan & Architecture** | ✅ | Full project breakdown and roadmap · [`docs/PLAN.md`](docs/PLAN.md) |
| **REA Reverse Engineering** | ✅ | PE analysis of `PINBALL.EXE` (`4e675a78ba3a...`), exports, RTTI, and installer decompression · [`re/binary_analysis.json`](re/binary_analysis.json) |
| **`RESOURCE.MAP` / `.001` Parser** | 🟡 | Binary chunk parser for `.BMP`, `.PAL`, `.ANM`, `.ITF`, `.WAV`, `.MID`, `.RES` · [spec](docs/formats/resource_map.md) |
| **256-Color & Z-Buffer Renderer** | 🟡 | 8-bit indexed playfield, animated targets, flippers, ramps, and LED scoreboard |
| **WebAssembly Physics Core** | 🟡 | Sub-step ball collision (`PB_COL`), ramp splines (`PB_SPLIN`), flippers, kickers, and tilt mechanics |
| **Audio Engine** | 🟡 | Web Audio API sound effects & synthesizer music manager with stereo panning · [spec](docs/formats/sound.md) |
| **3 Playable Tables** | 🟡 | **Colony**, **Command Post**, and **Mine** progression, mini-objectives, and multiball |
| **HTML5 Native UI** | 🟡 | Windows 95 / Space Outpost chrome, menu dropdowns, table picker, preferences, and high scores |
| **Mobile Touch Controls** | 🟡 | On-screen Left/Right Flippers, Plunger launch bar, and Nudge buttons for iOS & Android |
| **Localization (i18n)** | ✅ | 6 full languages supported: PT-BR, EN, ES, RU, ZH-CN, DE |
| **Vercel & PWA Ready** | ✅ | Optimized static build with edge caching headers (`vercel.json`) |

---

## 🎮 Running the Game

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Local Development
```bash
# Clone the repository
git clone https://github.com/pedryvo/3dpinball.git
cd 3dpinball

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:3000` to play immediately!

### Production Build
```bash
# Build optimized static distribution
npm run build

# Preview build locally
npm run preview
```

The resulting `dist/` folder is self-contained and ready to be deployed to Vercel, Netlify, or Cloudflare Pages.

---

## 🚀 Deploying to Vercel

Deploy with a single command via the Vercel CLI:
```bash
vercel
```

Or connect the repository `pedryvo/3dpinball` to your [Vercel Dashboard](https://vercel.com/) for automatic deployments on every `git push`.

---

## 🕹️ Controls

| Action | Desktop Keyboard | Mobile Touch |
|---|---|---|
| **Left Flipper** | `Left Shift` / `Z` / `Left Arrow` | ◀ **LEFT FLIPPER** Zone |
| **Right Flipper** | `Right Shift` / `/` / `Right Arrow` | **RIGHT FLIPPER** ▶ Zone |
| **Launch Ball (Plunger)** | `Spacebar` / `Enter` / `Down Arrow` | 🚀 **LAUNCH** Hold & Release |
| **Bump / Nudge Left** | `X` or `A` | ↖ **NUDGE L** Button |
| **Bump / Nudge Right** | `.` or `D` | ↗ **NUDGE R** Button |
| **Bump / Nudge Up** | `Up Arrow` or `W` | ▲ **NUDGE UP** Button |
| **Switch Table (Colony / Command / Mine)** | `1`, `2`, `3` | 🎯 Table Picker Toolbar |
| **Pause Game** | `P` / `Esc` | ⏸️ Pause Toolbar Button |
| **New Game** | `F2` | 🎮 New Game Menu |
| **High Scores** | `H` | 🏆 High Scores Button |

---

## 🗂️ Project Layout

```
docs/
  PLAN.md                Development roadmap and task milestones
  formats/
    resource_map.md      Dynamix RESOURCE.MAP / RESOURCE.001 / RESOURCE.002 specification
    physics_engine.md    PB_COL.C and PB_SPLIN.C collision & spline specifications
    sound.md             HMI SOS (SOS9502.DLL) WAV & MIDI bank specifications
public/
  assets/                Extracted palettes, bitmaps, animations, and audio assets
re/
  binary_analysis.json   REA Ghidra analysis of PINBALL.EXE (exports, RTTI, source assertions)
  window_procs.json      Exported Borland C++ Window/Dialog procedures and WM_COMMAND IDs
  fidelity-audit.md      Reverse-engineering verification notes and evidence ledger
src/
  archive/               Binary parsers for Clickteam installer & Dynamix RESOURCE.MAP/.001/.002
  audio/                 Web Audio API sound effects & FM/MIDI synthesizer manager
  physics/               WebAssembly & TypeScript rigid-body pinball physics (PB_COL, PB_SPLIN)
  render/                256-color palette decoder, Z-buffer playfield renderer, and LED HUD
  tables/                Colony, Command Post, and Mine table geometries, targets, and rules
  ui/                    HTML5 Windows 95 / Space Outpost chrome, modals, and mobile touch controls
  i18n/                  Complete translations (PT-BR, EN, ES, RU, ZH-CN, DE)
  main.ts                Application bootstrap and 60Hz/240Hz simulation loop
```

---

## 🔬 Methodology

1. **Static Analysis & Ghidra Extraction**: Both the Clickteam Install Creator stub (`3D Ultra Pinball1.exe`, `sha256: 9c58e1d58e65...`) and the main Windows PE32 executable `PINBALL.EXE` (`sha256: 4e675a78ba3a...`) were analyzed with Ghidra 12.1.2 via the **REA** (Reverse Engineer Anything) MCP server to recover the custom 4-bit header DEFLATE algorithm (`FUN_004097ba`), Window Procedures (`@mainWndProc$qpvuiuil`, `@pinWndProc$qpvuiuil`), Borland C++ RTTI classes (`GFXDevWinG`, `GFXZBuffer`, `StreamIO`), and source file assertions (`PB_COL.C`, `PB_SPLIN.C`, `PB_FRAME.C`, `TS_DRAW.C`).
2. **Container & Asset Analysis**: `RESOURCE.MAP`, `RESOURCE.001`, and `RESOURCE.002` structures, together with `HISCORES.DAT` and `PBPREFS.CFG`, were mapped and verified using byte-level inspection scripts.
3. **Clean-Room Web & Wasm Implementation**: Simulation, collision physics, and rendering run natively on WebAssembly, TypeScript, HTML5 Canvas, and Web Audio API without legacy x86 emulation overhead.
4. **Accessible Multilingual Web UI**: All window menus, preferences, high-score tables, and interactive guides are implemented with accessible semantic HTML5 components and localized across 6 languages.

---

## ⚖️ Legal Notice

_3-D Ultra Pinball_, Dynamix, Sierra On-Line, and related indicia are trademarks of and copyright © their respective owners.

This is an open-source non-profit educational project developed for software preservation and interoperability research.

The source code of **3dpinball** is licensed under the [GNU General Public License v3.0 or later](LICENSE).
