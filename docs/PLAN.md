# Plano de Desenvolvimento & Arquitetura: 3-D Ultra Pinball Web Port

Porting do clássico *3-D Ultra Pinball* (Dynamix / Sierra On-Line, 1995) para a Web moderna utilizando **WebAssembly**, **TypeScript**, **HTML5 Canvas** e **Web Audio API**.

---

## 🏗️ Visão Geral da Arquitetura do Sistema

O projeto é estruturado em camadas desacopladas que operam em harmonia com zero overhead de emulação x86:

```
┌──────────────────────────────────────────────────────────────────┐
│                   HTML5 Canvas & UI Windows 95                   │
│  - Moldura Win95, menus suspensos, caixas de diálogo modais      │
│  - Controles touch para smartphones (Flippers, Plunger, Nudge)   │
└──────────────▲────────────────────────────────────▲──────────────┘
               │                                    │
┌──────────────┴──────────────┐      ┌──────────────┴──────────────┐
│  Renderizador 640×480 Canvas│      │   Sub-sistema de Áudio      │
│  - Decodificação de BMP:    │      │   - Reprodução PCM WAV      │
│  - Paletas GFXPalette (PAL) │      │   - Panning estéreo 2D      │
│  - Placar LED Dot-Matrix    │      │   - Sintetizador FM espacial│
│  - Trilhas de bola e luzes  │      │                             │
└──────────────▲──────────────┘      └──────────────▲──────────────┘
               │                                    │
┌──────────────┴────────────────────────────────────┴──────────────┐
│             Simulação de Física (PinballSimulation)              │
│  - Integração sub-step 480Hz (8 passos por frame a 60 FPS)       │
│  - Colisão rígida e impulso angular dos rebatedores (PB_COL)     │
│  - Splines quadráticas para rampas e habitrails (PB_SPLIN)       │
│  - Transições de mesas, missões, multiplicadores e multiball     │
└──────────────▲────────────────────────────────────▲──────────────┘
               │                                    │
┌──────────────┴──────────────┐      ┌──────────────┴──────────────┐
│ Núcleo WebAssembly          │      │  Extrator e Parsers Dynamix │
│ - distance2d, dot2d, clamp  │      │  - parseDynamixBitmap (BMP:)│
│ - quadBezier evaluation     │      │  - parseDynamixPalette (PAL)│
│ - Fallback JS síncrono      │      │  - parseDynamixTableMap(TBL)│
└─────────────────────────────┘      │  - parseTextResource (RES)  │
                                     └─────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos e Responsabilidades

| Arquivo / Diretório | Responsabilidade |
|---|---|
| [`index.html`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/index.html) | Ponto de entrada HTML5 com janela estilo Windows 95, menus, placar, canvas e controles móveis. |
| [`src/main.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/main.ts) | Orquestrador principal: inicia áudio, simulação, renderizador, loop de jogo (`requestAnimationFrame`) e eventos. |
| [`src/archive/parser.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/archive/parser.ts) | Parsers binários TypeScript dos formatos de arquivo da Dynamix (`BMP:`, `RIFF PAL`, `MAP:`, `RES`). |
| [`src/archive/types.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/archive/types.ts) | Tipos e contratos de dados das estruturas de arquivo extraídas. |
| [`src/physics/wasm-physics.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/physics/wasm-physics.ts) | Bytecode binário WebAssembly embutido para cálculo vetorial ultra-rápido, projeções e splines Bezier. |
| [`src/physics/engine.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/physics/engine.ts) | Motor completo de simulação de pinball a 480Hz: colisão bola-segmento, bumpers, rampas, sinkholes, flippers e tilt. |
| [`src/tables/tables.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/tables/tables.ts) | Geometrias e dados das 3 mesas: **Colônia Espacial (Outpost)**, **Posto de Comando (Command Post)** e **Mina de Cristais (Mine)**. |
| [`src/tables/types.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/tables/types.ts) | Definições de paredes, alvos, bumpers, rampas spline, sinkholes e propriedades físicas de cada mesa. |
| [`src/renderer/table-renderer.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/renderer/table-renderer.ts) | Renderizador Canvas HTML5 640×480: decodificação das paletas autênticas, iluminação dinâmica, placar LED Dot-Matrix e mola. |
| [`src/audio/audio-manager.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/audio/audio-manager.ts) | Gerenciador Web Audio API: pré-carregamento e reprodução de efeitos sonoros WAV com pan 2D e trilha sintetizada FM espacial. |
| [`src/ui/menu-manager.ts`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/ui/menu-manager.ts) | Gerenciador da interface Win95: menus suspensos, recordes (`HISCORES.DAT`), controles, diálogos modais e reatividade i18n. |
| [`src/i18n/`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/src/i18n/) | Sistema de internacionalização com 6 idiomas: `pt-BR`, `en`, `es`, `de`, `zh-CN`, `ru`. |
| [`tests/regressions.mjs`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/tests/regressions.mjs) | Suíte automatizada de testes de regressão cobrindo parsers, física, WASM, i18n e ciclo de vida da simulação. |
| [`public/assets/`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/public/assets/) | Bitmaps autênticos (`.BMP`), paletas (`.PAL`), arquivos de tabela (`.TBL`) e recursos de texto (`.RES`). |
| [`public/sfx/`](file:///home/pedryvo/Downloads/3-D-Ultra-Pinball_Win-3x_EN_Easy-Setup-32-bits-version/public/sfx/) | 36 efeitos sonoros originais em formato WAV extraídos dos volumes `RESOURCE.002` / `SOS9502.DLL`. |

---

## 🎮 Fases Implementadas

### Fase 1: Engenharia Reversa & Extração Binária (Concluída)
- [x] Análise do instalador Clickteam (`3D Ultra Pinball1.exe`, SHA256: `9c58e1d58e65...`) com REA MCP & Ghidra (`FUN_0040702a`, `FUN_004097ba`, `FUN_004091c4`) para descompressão dos 29 arquivos originais.
- [x] Mapeamento do `PINBALL.EXE` (1.863 procedimentos, 99 imports Win32, classes RTTI Borland C++ e asserções de código-fonte).
- [x] Documentação das tabelas de janelas (`re/window_procs.json`) e da arquitetura do executável (`re/binary_analysis.json`).
- [x] Especificação dos volumes `RESOURCE.MAP`, `RESOURCE.001` e `RESOURCE.002` (`docs/formats/resource_map.md`).
- [x] Engenharia reversa dos chunks `BMP:`, `RIFF PAL`, `ANM:`, `ITF:`, `MAP:`/`.TBL`, `TEXT.RES` e `CREDITS.RES`.

### Fase 2: Extração de Ativos & Parsers Binários (Concluída)
- [x] Extração das paletas autênticas de 256 cores (`OUTPOST.PAL`, `CP.PAL`, `MINE.PAL`, `SCORE.PAL`, `SHELL.PAL`, `LOGO.PAL`) e imagens 640×480 (`OUTPOSTJ.BMP`, `CPJ.BMP`, `MINEJ.BMP`, `LOGO.BMP`, `SIERRA.BMP`, `BALLS.BMP`).
- [x] Extração de efeitos sonoros PCM WAV em `public/sfx/` (`FLIPPER.WAV`, `KACHUNK1..4.WAV`, `ZAP1..4.WAV`, `EXPLO1..2.WAV`, `FANFARE1..2.WAV`, `VICTORY1.WAV`, `LOSE1.WAV`, `CRYSTAL1.WAV`, `ROLL1.WAV`, etc.).
- [x] Parsers em TypeScript para decodificação em tempo de execução (`parseDynamixBitmap`, `parseDynamixPalette`, `parseDynamixTableMap`, `parseTextResource`).

### Fase 3: Núcleo de Física WebAssembly 480Hz & 3 Mesas (Concluída)
- [x] Compilação do módulo WebAssembly para aceleração de produto escalar, distância e curvas de Bezier (`src/physics/wasm-physics.ts`).
- [x] Integração de 8 sub-passos por quadro a 60 FPS (frequência efetiva de 480Hz).
- [x] Implementação de colisão círculo-segmento, rampas spline (`PB_SPLIN.C`), restituição elástica de bumpers, impulso angular de múltiplos rebatedores por mesa e mecânica de Tilt.
- [x] Geometrias, alvos, iluminações e objetivos para as 3 mesas:
  1. **Colônia Espacial (Outpost)**: Espaçoporto, laboratório, centro de operações, pedras de energia e Super Glide.
  2. **Posto de Comando (Command Post)**: Desafios táticos militares de energia, brecha, suprimentos e alerta vermelho.
  3. **Mina de Cristais (Mine)**: Detonação de cavernas, jackpot da jazida principal (Motherlode) e Multi-Ball de 3 esferas.

### Fase 4: Renderizador 256 Cores & Placar LED Dot-Matrix (Concluída)
- [x] Decodificação de bitmaps originais da Dynamix em conjunto com as paletas RIFF PAL para renderização precisa em canvas ImageData.
- [x] Sistema de fallback vetorial estilizado de alta definição.
- [x] Iluminação dinâmica de alvos e flashes dos bumpers.
- [x] Animação fluida dos rebatedores em seus respectivos eixos de rotação.
- [x] Renderização de esferas metálicas com sombreamento esférico, brilho especular e rastro de movimento (motion trail).
- [x] Placar Sierra LED Dot-Matrix com pontuação formatada, bolas restantes, multiplicador e letreiro de missões.

### Fase 5: Interface Nativa HTML5, Áudio & Controles Touch (Concluída)
- [x] Moldura de janela clássica Windows 95 com barra de título, botões minimizar/maximizar/fechar e menus suspensos (**Jogo**, **Opções**, **Mesa**, **Idioma**, **Ajuda**).
- [x] Modais interativos para Recordes (`HISCORES.DAT` com persistência local), Seletor de Mesas, Manual de Controles e Créditos originais.
- [x] Sub-sistema Web Audio API com carregamento assíncrono de WAVs, posicionamento estéreo 2D dependente da coordenada X na mesa e sintetizador de trilha sonora espacial FM retrô.
- [x] Painel de controles táteis na tela para navegadores móveis (smartphones e tablets) com rebatedores esquerdo/direito, mola e botões de empurrão (nudge).

### Fase 6: Localização em 6 Idiomas (i18n) & Validação de Produção (Concluída)
- [x] Tradução completa com troca dinâmica sem recarregar a página para 6 idiomas:
  - 🇧🇷 Português do Brasil (`pt-BR`)
  - 🇺🇸 Inglês (`en`)
  - 🇪🇸 Espanhol (`es`)
  - 🇩🇪 Alemão (`de`)
  - 🇨🇳 Chinês Simplificado (`zh-CN`)
  - 🇷🇺 Russo (`ru`)
- [x] Suíte automatizada de testes de regressão (`tests/regressions.mjs` executada via `npm test`) validando 10 suítes com 100% de aprovação.
- [x] Compilação estática de produção (`npm run build`) validada via TypeScript e Vite.

### Fase 7: Polimento Arcade & Fidelidade Dinâmica (Concluída)
- [x] Suporte a Gamepad API (`src/input/gamepad-manager.ts`) com controles padrão (Xbox, PlayStation, USB retrô) e vibração háptica `dual-rumble` em impactos de bumpers, explosões e fim de jogo.
- [x] Colisão elástica esfera-esfera em Multi-Ball (`src/physics/engine.ts`) com resolução de penetração, conservação de momento ($e = 0.94$) e som de choque estéreo `KACHUNK1.WAV`.
- [x] Miniaturas gráficas autênticas no seletor de mesas (`PICKOP.BMP`, `PICKCP.BMP`, `PICKMINE.BMP`) decodificadas com paletas originais da Dynamix.
- [x] Lâmpadas indicadoras de multiplicador no playfield (`2X`, `3X`, `5X`, `10X`) e escudo de força holográfico Ball Save (`src/renderer/table-renderer.ts`).
- [x] Sistema de partículas neon sci-fi (`src/renderer/particle-system.ts`) e renderizador de fontes bitmap Sierra (`src/renderer/bitmap-font.ts`).
- [x] Instalação como Progressive Web App (PWA) e execução 100% offline (`manifest.json` e `sw.js`).

---

## 🛠️ Comandos de Desenvolvimento e Validação

```bash
# Executar a suíte completa de testes automatizados (10/10 suítes)
npm test

# Executar a verificação estrita de tipagem TypeScript
npx tsc --noEmit

# Compilar para produção (Vite + TypeScript)
npm run build

# Iniciar servidor local de desenvolvimento Vite
npm run dev

# Visualizar a compilação de produção localmente
npm run preview
```

---

## 🚀 Próximos Passos & Melhorias Futuras (Fase 8)
- [ ] Reprodução de vídeos Cinepak/AVI originais (`SIERRA.AVI`, `INTRO.AVI`) através de decodificador em WebAssembly.
- [ ] Tabela global de recordes via edge API / KV na nuvem.
