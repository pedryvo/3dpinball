<div align="center">

# 3dpinball

**Engenharia reversa e porte moderno para a Web (TypeScript, HTML5 Canvas, WebAssembly e Web Audio API) de _3-D Ultra Pinball_ (Dynamix / Sierra On-Line, 1995)**

[![TypeScript](https://img.shields.io/badge/typescript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/webassembly-physics_core-654ff0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Status](https://img.shields.io/badge/status-jog%C3%A1vel-success)](#-progresso)
[![Fase](https://img.shields.io/badge/fase-6_%E2%80%94_pronto_para_produ%C3%A7%C3%A3o-success)](docs/PLAN.md)
[![Plataformas](https://img.shields.io/badge/plataformas-Web_%7C_Vercel_%7C_Mobile-lightgrey)](#-como-jogar)
[![Licença: GPL-3.0](https://img.shields.io/badge/licen%C3%A7a-GPL--3.0--or--later-blue)](LICENSE)

_O clássico de pinball espacial de 1995 da Dynamix / Sierra,<br>reimplementado para rodar nativamente em qualquer navegador moderno, desktop e smartphone._

[English](README.md) · **Português** · [Español](README.es.md) · [Deutsch](README.de.md) · [中文](README.zh-CN.md) · [Русский](README.ru.md)

</div>

---

## 🚀 Sobre o Projeto

**3dpinball** estuda o executável original de _3-D Ultra Pinball_ (`PINBALL.EXE`), seu subsistema de som (`SOS9502.DLL`) e seus pacotes de recursos (`RESOURCE.MAP`, `RESOURCE.001`, `RESOURCE.002`) (Dynamix / Sierra On-Line, 1995) utilizando o servidor MCP **REA** (Reverse Engineer Anything) e Ghidra para mapear todos os formatos binários, procedimentos de janela (`@mainWndProc$qpvuiuil`, `@pinWndProc$qpvuiuil`), o renderizador 2D/Z-buffer Three-Space (`TS_DRAW.C`, `GFXDevWinG`) e a física de colisão e splines (`PB_COL.C`, `PB_SPLIN.C`, `PB_FRAME.C`), entregando uma implementação nativa e limpa para a web moderna.

Diferente de emuladores x86 pesados no navegador, este porte roda nativamente em TypeScript, WebAssembly e HTML5 Canvas **sem overhead de emulação**:

- 🌐 **Interface HTML5 Espacial & Windows 95**: Moldura clássica estilo Windows 95 combinada com painel tático de colônia espacial (placar LED em matriz de pontos, telemetria de multiplicadores, missões nas 3 mesas **Colônia**, **Posto de Comando** e **Mina**, e menus HTML5 acessíveis).
- 📱 **Otimizado para Dispositivos Móveis (Mobile-Friendly)**: Layout responsivo para celulares e tablets, com botões de toque dedicados para os Flippers (Esquerdo/Direito), lançador de mola (Plunger) e botões de empurrão da mesa (Nudge/Tilt).
- 🎨 **Gráficos de 256 Cores com Precisão de Pixel & Z-Buffer**: Decodificação das paletas (`.PAL`), bitmaps (`.BMP`), animações (`.ANM`) e interfaces (`.ITF`) da Dynamix usando o pipeline indexado de 8 bits (`GFXPalette`, `GFXZBuffer`).
- ⚙️ **Física Rígida e Splines em WebAssembly**: Simulação de sub-passos em alta frequência, impulso angular dos flippers, restituição de bumpers, rampas em spline (`PB_SPLIN.C`) e máscaras de colisão (`PB_COL.C`).
- 🔊 **Áudio e Sintetizador via Web Audio API**: Reprodução dos efeitos sonoros PCM `.WAV` (`SX_%04d.WAV`) e trilhas sintetizadas FM/MIDI (`SX_%04d.MID`) com Web Audio API.
- 🌍 **Localização Completa em 6 Idiomas (i18n)**: Inicia automaticamente no idioma do usuário (**Português do Brasil**, **Inglês**, **Espanhol**, **Russo**, **Chinês Simplificado** e **Alemão**) com troca instantânea em tempo real em menus, caixas de diálogo, missões e avisos do placar.
- ⚡ **Pronto para Publicação na Vercel**: Compilação ultra-rápida com Vite pronta para deploy estático na Vercel.

---

## 📊 Progresso

| Área | Estado | Detalhes |
|---|:---:|---|
| **Plano e Arquitetura** | ✅ | Roteiro completo de desenvolvimento e marcos · [`docs/PLAN.md`](docs/PLAN.md) |
| **Engenharia Reversa (REA)** | ✅ | Análise PE do `PINBALL.EXE` (`4e675a78ba3a...`), exports, RTTI e extrator Clickteam · [`re/binary_analysis.json`](re/binary_analysis.json) |
| **Leitor `RESOURCE.MAP` / Assets** | ✅ | Parser binário de `.BMP`, `.PAL`, `.ANM`, `.ITF`, `.WAV`, `.MID`, `.RES` · [especificação](docs/formats/resource_map.md) |
| **Renderizador 256 Cores & Z-Buffer** | ✅ | Mesa indexada em 8 bits, alvos animados, flippers, rampas e painel LED |
| **Núcleo de Física WebAssembly** | ✅ | Colisão em sub-passos (`PB_COL`), rampas spline (`PB_SPLIN`), flippers, kickers e tilt |
| **Motor de Áudio** | ✅ | Web Audio API para efeitos sonoros e sintetizador musical com pan estéreo · [especificação](docs/formats/sound.md) |
| **3 Mesas Jogáveis** | ✅ | Progressão entre **Colônia**, **Posto de Comando** e **Mina**, mini-objetivos e multiball |
| **Interface Nativa HTML5** | ✅ | Janela Windows 95 / Colônia Espacial, menus, seletor de mesas, preferências e recordes |
| **Controles Touch Mobile** | ✅ | Botões de Flipper Esquerdo/Direito, barra de lançamento e Nudge na tela |
| **Localização (i18n)** | ✅ | 6 idiomas completos: PT-BR, EN, ES, RU, ZH-CN, DE |
| **Gamepad & Dual-Rumble** | ✅ | Suporte nativo a gamepads com vibração háptica dual-rumble |
| **PWA & Modo Offline** | ✅ | Manifesto Progressive Web App e Service Worker Cache-First para jogo 100% offline |
| **Regressões Automatizadas** | ✅ | 10 suítes de testes completas cobrindo parsers binários, WASM, multiball, bitmaps e física (`npm test`) |
| **Pronto para Vercel & PWA** | ✅ | Build estático otimizado com cabeçalhos de cache (`vercel.json`) |

---

## 🎮 Como Jogar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18 ou superior recomendado)
- `npm`

### Desenvolvimento Local
```bash
# Clone o repositório
git clone https://github.com/pedryvo/3dpinball.git
cd 3dpinball

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento Vite
npm run dev
```

Abra o navegador em `http://localhost:3000` para jogar imediatamente!

### Build de Produção
```bash
# Gera a distribuição estática otimizada
npm run build

# Visualiza o build localmente
npm run preview
```

---

## 🕹️ Controles

| Ação | Teclado (Desktop) | Toque (Mobile) |
|---|---|---|
| **Flipper Esquerdo** | `Shift Esquerdo` / `Z` / `Seta Esquerda` | ◀ Botão **FLIPPER ESQ** |
| **Flipper Direito** | `Shift Direito` / `/` / `Seta Direita` | Botão **FLIPPER DIR** ▶ |
| **Lançar Bola (Plunger)** | `Espaço` / `Enter` / `Seta Baixo` | 🚀 Segurar e Soltar **LANÇAR** |
| **Empurrar Mesa (Esquerda)** | `X` ou `A` | ↖ Botão **IMPULSO ESQ** |
| **Empurrar Mesa (Direita)** | `.` ou `D` | ↗ Botão **IMPULSO DIR** |
| **Empurrar Mesa (Cima)** | `Seta Cima` ou `W` | ▲ Botão **IMPULSO CIMA** |
| **Trocar Mesa (Colônia / Comando / Mina)** | `1`, `2`, `3` | 🎯 Seletor de Mesas |
| **Pausar Jogo** | `P` / `Esc` | ⏸️ Botão Pausar |
| **Novo Jogo** | `F2` | 🎮 Menu Novo Jogo |
| **Recordes (High Scores)** | `H` | 🏆 Botão Recordes |

---

## ⚖️ Aviso Legal

_3-D Ultra Pinball_, Dynamix, Sierra On-Line e marcas relacionadas pertencem aos seus respectivos proprietários.

Este é um projeto educacional de código aberto sem fins lucrativos desenvolvido para preservação de software e interoperabilidade. Apenas o código-fonte e assets de demonstração web necessários estão incluídos; os executáveis originais não são distribuídos no repositório.

O código-fonte do **3dpinball** é licenciado sob a [GNU General Public License v3.0 ou posterior](LICENSE).
