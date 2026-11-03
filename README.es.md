<div align="center">

# 3dpinball

**Ingeniería inversa y port web moderno (TypeScript, HTML5 Canvas, WebAssembly y Web Audio API) de _3-D Ultra Pinball_ (Dynamix / Sierra On-Line, 1995)**

[![TypeScript](https://img.shields.io/badge/typescript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/webassembly-physics_core-654ff0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Estado](https://img.shields.io/badge/estado-jugable-success)](#-progreso)
[![Fase](https://img.shields.io/badge/fase-6_%E2%80%94_listo_para_producci%C3%B3n-success)](docs/PLAN.md)
[![Plataformas](https://img.shields.io/badge/plataformas-Web_%7C_Vercel_%7C_M%C3%B3vil-lightgrey)](#-c%C3%B3mo-jugar)
[![Licencia: GPL-3.0](https://img.shields.io/badge/licencia-GPL--3.0--or--later-blue)](LICENSE)

_El clásico de pinball espacial de 1995 de Dynamix / Sierra,<br>rediseñado para ejecutarse de forma nativa en cualquier navegador moderno, PC y teléfono móvil._

[English](README.md) · [Português](README.pt-BR.md) · **Español** · [Deutsch](README.de.md) · [中文](README.zh-CN.md) · [Русский](README.ru.md)

</div>

---

## 🚀 Acerca del Proyecto

**3dpinball** estudia el ejecutable original de _3-D Ultra Pinball_ (`PINBALL.EXE`), su subsistema de audio (`SOS9502.DLL`) y sus archivos de recursos (`RESOURCE.MAP`, `RESOURCE.001`, `RESOURCE.002`) (Dynamix / Sierra On-Line, 1995) mediante **REA** (Reverse Engineer Anything) y Ghidra para comprender cada formato binario, procedimiento de ventana (`@mainWndProc$qpvuiuil`, `@pinWndProc$qpvuiuil`), el renderizador 2D/Z-buffer (`TS_DRAW.C`, `GFXDevWinG`) y las físicas de colisión y splines (`PB_COL.C`, `PB_SPLIN.C`, `PB_FRAME.C`), ofreciendo una implementación web nativa y limpia.

A diferencia de los pesados emuladores x86 en el navegador, este port se ejecuta de forma nativa en TypeScript, WebAssembly y HTML5 Canvas **sin sobrecarga de emulación**:

- 🌐 **Interfaz HTML5 Espacial y Windows 95**: Marco clásico estilo Windows 95 combinado con un panel táctico de colonia espacial (marcador LED de matriz de puntos, telemetría de multiplicadores, misiones en las 3 mesas **Colonia**, **Puesto de Mando** y **Mina**, y menús HTML5 accesibles).
- 📱 **Optimizado para Dispositivos Móviles**: Diseño adaptable con botones táctiles dedicados para los Flippers (Izquierdo/Derecho), lanzador de resorte (Plunger) y botones de empuje (Nudge/Tilt).
- 🎨 **Gráficos de 256 Colores con Precisión de Píxel y Z-Buffer**: Decodificación de paletas (`.PAL`), mapas de bits (`.BMP`), animaciones (`.ANM`) e interfaces (`.ITF`) de Dynamix con el pipeline indexado de 8 bits (`GFXPalette`, `GFXZBuffer`).
- ⚙️ **Física Rígida y Splines en WebAssembly**: Simulación de sub-pasos de alta frecuencia, impulso angular de flippers, restitución de bumpers, rampas en spline (`PB_SPLIN.C`) y máscaras de colisión (`PB_COL.C`).
- 🔊 **Sonido y Sintetizador vía Web Audio API**: Reproducción de efectos de sonido PCM `.WAV` (`SX_%04d.WAV`) y pistas sintetizadas FM/MIDI (`SX_%04d.MID`) mediante Web Audio API.
- 🌍 **Localización Completa en 6 Idiomas (i18n)**: Se inicia automáticamente en el idioma regional del usuario (**Portugués de Brasil**, **Inglés**, **Español**, **Ruso**, **Chino Simplificado** y **Alemán**) con cambio en tiempo real.
- ⚡ **Listo para Despliegue en Vercel**: Compilación ultrarrápida con Vite lista para publicar en Vercel.

---

## 📊 Progreso

| Área | Estado | Detalles |
|---|:---:|---|
| **Plan y Arquitectura** | ✅ | Hoja de ruta completa · [`docs/PLAN.md`](docs/PLAN.md) |
| **Ingeniería Inversa (REA)** | ✅ | Análisis PE de `PINBALL.EXE` y descompresión Clickteam · [`re/binary_analysis.json`](re/binary_analysis.json) |
| **Lector `RESOURCE.MAP` / Assets** | ✅ | Parser binario de `.BMP`, `.PAL`, `.ANM`, `.ITF`, `.WAV`, `.MID`, `.RES` · [especificación](docs/formats/resource_map.md) |
| **Renderizador 256 Colores & Z-Buffer** | ✅ | Mesa indexada de 8 bits, dianas animadas, flippers, rampas y panel LED |
| **Núcleo de Física WebAssembly** | ✅ | Colisión en sub-pasos a 480Hz (`PB_COL`), splines Bezier (`PB_SPLIN`) y tilt |
| **Motor de Audio** | ✅ | Web Audio API para efectos de sonido con paneo estéreo y sintetizador FM · [especificación](docs/formats/sound.md) |
| **3 Mesas Jugables** | ✅ | **Colonia**, **Puesto de Mando** y **Mina**, mini-objetivos y multiball |
| **Interfaz Nativa HTML5** | ✅ | Ventana Windows 95, menús desplegables, preferencias y récords |
| **Controles Táctiles y Gamepad** | ✅ | Botones táctiles para móviles y soporte para mandos con vibración háptica |
| **Localización (i18n)** | ✅ | 6 idiomas completos: PT-BR, EN, ES, RU, ZH-CN, DE |
| **Regresiones Automatizadas** | ✅ | 10 suites completas de pruebas automatizadas (`npm test`) |
| **PWA & Listo para Vercel** | ✅ | Service worker para juego offline y build estático optimizado (`vercel.json`) |

---

## 🎮 Cómo Jugar

```bash
git clone https://github.com/pedryvo/3dpinball.git
cd 3dpinball
npm install
npm run dev
```

¡Abre `http://localhost:3000` en tu navegador para jugar!

---

## 🕹️ Controles

| Acción | Teclado (PC) | Táctil (Móvil) |
|---|---|---|
| **Flipper Izquierdo** | `Shift Izquierdo` / `Z` / `Flecha Izquierda` | ◀ Botón **FLIPPER IZQ** |
| **Flipper Derecho** | `Shift Derecho` / `/` / `Flecha Derecha` | Botón **FLIPPER DER** ▶ |
| **Lanzar Bola (Plunger)** | `Espacio` / `Enter` / `Flecha Abajo` | 🚀 Mantener y Soltar **LANZAR** |
| **Empujar Mesa (Izquierda)** | `X` o `A` | ↖ Botón **EMPUJE IZQ** |
| **Empujar Mesa (Derecha)** | `.` o `D` | ↗ Botón **EMPUJE DER** |
| **Empujar Mesa (Arriba)** | `Flecha Arriba` o `W` | ▲ Botón **EMPUJE ARRIBA** |
| **Cambiar Mesa (Colonia / Mando / Mina)** | `1`, `2`, `3` | 🎯 Selector de Mesas |
| **Pausar Juego** | `P` / `Esc` | ⏸️ Botón Pausa |
| **Nuevo Juego** | `F2` | 🎮 Menú Nuevo Juego |

---

## ⚖️ Aviso Legal

_3-D Ultra Pinball_, Dynamix y Sierra On-Line son marcas comerciales y derechos de autor © de sus respectivos propietarios. Proyecto educativo sin fines de lucro publicado bajo la [GNU General Public License v3.0 o posterior](LICENSE).
