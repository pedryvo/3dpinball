<div align="center">

# 3dpinball

**Reverse Engineering und moderner Web-Port (TypeScript, HTML5 Canvas, WebAssembly & Web Audio API) von _3-D Ultra Pinball_ (Dynamix / Sierra On-Line, 1995)**

[![TypeScript](https://img.shields.io/badge/typescript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/webassembly-physics_core-654ff0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Status](https://img.shields.io/badge/status-spielbar-success)](#-fortschritt)
[![Phase](https://img.shields.io/badge/phase-6_%E2%80%94_produktionsbereit-success)](docs/PLAN.md)
[![Plattformen](https://img.shields.io/badge/plattformen-Web_%7C_Vercel_%7C_Mobil-lightgrey)](#-spiel-starten)
[![Lizenz: GPL-3.0](https://img.shields.io/badge/lizenz-GPL--3.0--or--later-blue)](LICENSE)

_Der Weltraum-Flipper-Klassiker von Dynamix / Sierra aus dem Jahr 1995,<br>neu entwickelt für moderne Browser, Desktop-PCs und Smartphones._

[English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · **Deutsch** · [中文](README.zh-CN.md) · [Русский](README.ru.md)

</div>

---

## 🚀 Über das Projekt

**3dpinball** analysiert die originale Programmdatei von _3-D Ultra Pinball_ (`PINBALL.EXE`), das Audiosystem (`SOS9502.DLL`) und die Ressourcenarchive (`RESOURCE.MAP`, `RESOURCE.001`, `RESOURCE.002`) (Dynamix / Sierra On-Line, 1995) mithilfe von **REA** (Reverse Engineer Anything) und Ghidra, um Dateiformate, Fensterprozeduren (`@mainWndProc$qpvuiuil`, `@pinWndProc$qpvuiuil`), den Three-Space 2D/Z-Buffer-Renderer (`TS_DRAW.C`, `GFXDevWinG`) sowie die Kollisions- und Spline-Physik (`PB_COL.C`, `PB_SPLIN.C`, `PB_FRAME.C`) zu rekonstruieren.

Im Gegensatz zu schwerfälligen x86-Emulatoren läuft dieser Port nativ in TypeScript, WebAssembly und HTML5 Canvas **ohne Emulations-Overhead**:

- 🌐 **Modernes Space-Outpost-HUD & Windows-95-Oberfläche**: Authentischer Windows-95-Rahmen kombiniert mit einem taktischen Weltraumkolonie-Dashboard (Punktmatrix-LED-Anzeige, Multiplikator-Telemetrie, Missionen auf den 3 Tischen **Kolonie**, **Kommandoposten** und **Mine** sowie barrierefreie HTML5-Menüs).
- 📱 **Mobilfreundlich & Touch-bereit**: Responsives Layout für Smartphones und Tablets mit eigenen Touch-Tasten für linken/rechten Flipper, Kugelabschuss (Plunger) und Tisch-Stoß (Nudge/Tilt).
- 🎨 **Pixelgenaue 256-Farben-Grafik & Z-Buffer**: Echtzeit-Dekodierung der Dynamix-Paletten (`.PAL`), Bitmaps (`.BMP`), Animationen (`.ANM`) und Layouts (`.ITF`) über die 8-Bit-Pipeline (`GFXPalette`, `GFXZBuffer`).
- ⚙️ **WebAssembly-Physik- & Spline-Engine**: Hochfrequente Sub-Step-Kugelphysik, Flipper-Drehimpuls, Bumper-Rückstoß, Rampen-Splines (`PB_SPLIN.C`) und Kollisionsmasken (`PB_COL.C`).
- 🔊 **Web Audio API Sound & Synthesizer-Musik**: Direkte Wiedergabe von PCM-`.WAV`-Soundeffekten (`SX_%04d.WAV`) und FM/MIDI-Soundtracks (`SX_%04d.MID`).
- 🌍 **Vollständige Lokalisierung in 6 Sprachen (i18n)**: Unterstützt **Brasilianisches Portugiesisch**, **Englisch**, **Spanisch**, **Russisch**, **Vereinfachtes Chinesisch** und **Deutsch** mit Live-Sprachwechsel.
- ⚡ **Bereit für Vercel**: Ultraschneller Vite-Build für statisches Hosting auf Vercel.

---

## 📊 Fortschritt

| Bereich | Status | Details |
|---|:---:|---|
| **Plan & Architektur** | ✅ | Vollständige Roadmap · [`docs/PLAN.md`](docs/PLAN.md) |
| **Reverse Engineering (REA)** | ✅ | PE-Analyse von `PINBALL.EXE` und Clickteam-Dekomprimierung · [`re/binary_analysis.json`](re/binary_analysis.json) |
| **`RESOURCE.MAP` / Asset-Parser** | ✅ | Binärer Parser für `.BMP`, `.PAL`, `.ANM`, `.ITF`, `.WAV`, `.MID`, `.RES` · [Spezifikation](docs/formats/resource_map.md) |
| **256-Farben-Renderer & Z-Buffer** | ✅ | 8-Bit-Spielfeld, animierte Bumper, Flipper, Rampen und LED-Anzeige |
| **WebAssembly-Physikkern** | ✅ | 480Hz-Sub-Step-Simulation (`PB_COL`), Bezier-Splines (`PB_SPLIN`) und Tilt |
| **Audio-Engine** | ✅ | Web Audio API für Soundeffekte mit Stereo-Panning und FM-Synthesizer · [Spezifikation](docs/formats/sound.md) |
| **3 Spielbare Tische** | ✅ | **Kolonie**, **Kommandoposten** und **Mine**, Mini-Ziele und Multiball |
| **HTML5-Benutzeroberfläche** | ✅ | Windows-95-Fenster, Dropdown-Menüs, Einstellungen und Highscores |
| **Touch-Steuerung & Gamepad** | ✅ | Touch-Tasten für Mobilgeräte und Gamepad-Unterstützung mit haptischem Feedback |
| **Lokalisierung (i18n)** | ✅ | 6 vollständige Sprachen: PT-BR, EN, ES, RU, ZH-CN, DE |
| **PWA & Vercel-Bereitstellung** | ✅ | Service Worker für Offline-Betrieb und optimierter Build (`vercel.json`) |

---

## 🎮 Spiel starten

```bash
git clone https://github.com/pedryvo/3dpinball.git
cd 3dpinball
npm install
npm run dev
```

Öffne `http://localhost:3000` im Browser, um sofort zu spielen!

---

## 🕹️ Steuerung

| Aktion | Desktop-Tastatur | Mobile Touch-Steuerung |
|---|---|---|
| **Linker Flipper** | `Umschalt Links` / `Z` / `Pfeil Links` | ◀ **FLIPPER LINKS** |
| **Rechter Flipper** | `Umschalt Rechts` / `/` / `Pfeil Rechts` | **FLIPPER RECHTS** ▶ |
| **Kugel abschießen (Plunger)** | `Leertaste` / `Enter` / `Pfeil Unten` | 🚀 **ABSCHUSS** halten & loslassen |
| **Tisch stoßen (Links)** | `X` oder `A` | ↖ **STOSS L** |
| **Tisch stoßen (Rechts)** | `.` oder `D` | ↗ **STOSS R** |
| **Tisch stoßen (Oben)** | `Pfeil Oben` oder `W` | ▲ **STOSS OBEN** |
| **Tisch wechseln (Kolonie / Kommando / Mine)** | `1`, `2`, `3` | 🎯 Tischauswahl |
| **Pause** | `P` / `Esc` | ⏸️ Pause-Taste |
| **Neues Spiel** | `F2` | 🎮 Menü Neues Spiel |

---

## ⚖️ Rechtlicher Hinweis

_3-D Ultra Pinball_, Dynamix und Sierra On-Line sind Marken und Urheberrechte © ihrer jeweiligen Eigentümer. Der Quellcode von **3dpinball** steht unter der [GNU General Public License v3.0 oder höher](LICENSE).
