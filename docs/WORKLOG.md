# Diário de Bordo & Registro de Implementação (Worklog)

Este documento registra detalhadamente todas as etapas de desenvolvimento, decisões técnicas tomadas, arquivos criados e modificados no porte de *3-D Ultra Pinball* (1995) para a Web.

---

## 📅 Registro de Atividades

### 1. Diagnóstico do Estado Inicial
- **Contexto:** O projeto contava com a análise reversa inicial (`docs/PLAN.md`, `re/binary_analysis.json`, `docs/formats/`), extração de arquivos binários em `public/assets/` e `public/sfx/`, parsers binários em `src/archive/`, internacionalização em `src/i18n/`, e o núcleo de física em `src/physics/` e `src/tables/`.
- **Gaps Identificados:**
  1. Ausência de `index.html` e folha de estilos Windows 95 / Painel Espacial.
  2. Ausência de `src/audio/audio-manager.ts` para gerenciar os arquivos WAV e a trilha sintetizada.
  3. Ausência de `src/renderer/table-renderer.ts` para decodificação das paletas e exibição da mesa a 640×480.
  4. Ausência de `src/ui/menu-manager.ts` para conectar os menus Win95, diálogos modais e reatividade i18n.
  5. Ausência de `src/main.ts` para orquestrar o loop do jogo (`requestAnimationFrame`), teclado e controles touch.
  6. Ausência da suíte automatizada de testes (`tests/regressions.mjs`) declarada em `package.json`.

---

### 2. Implementação do Sub-sistema de Áudio (`src/audio/audio-manager.ts`)
- **Objetivo:** Reproduzir os 36 efeitos sonoros autênticos extraídos de `RESOURCE.002` / `SOS9502.DLL` e fornecer uma trilha sonora espacial retrô sintetizada.
- **Decisões Técnicas:**
  - Inicialização resiliente da `AudioContext` respeitando a política de autoplay de navegadores modernos (ativação no primeiro gesto de interação: clique ou tecla).
  - Tabela de aliases de áudio (`soundAliases`) para mapear sons referenciados pelo motor de física para os arquivos reais existentes em `public/sfx/` (ex: `SPRING1.WAV` -> `KACHUNK4.WAV`, `GATE1.WAV` -> `DOOR1.WAV`).
  - Posicionamento estéreo espacial 2D (`StereoPannerNode`) mapeando a coordenada horizontal da mesa $X \in [0, 480]$ para pan $P \in [-1.0, 1.0]$.
  - Fallback sintetizado imediato usando osciladores caso o áudio ainda esteja sendo baixado ou o ambiente esteja offline.
  - Sintetizador procedimental FM/MIDI espacial em escala menor (D minor: Dm -> Bb -> Gm -> A) com osciladores de onda dente-de-serra e triangular filtrados por passa-baixa e passa-faixa, rodando a 125 BPM em compasso 16th-note.

---

### 3. Implementação do Renderizador Canvas 640×480 (`src/renderer/table-renderer.ts`)
- **Objetivo:** Exibir a mesa de pinball com gráficos autênticos de 256 cores, efeitos de luz dinâmica e placar LED.
- **Decisões Técnicas:**
  - Decodificação assíncrona dos arquivos `OUTPOSTJ.BMP`, `CPJ.BMP` e `MINEJ.BMP` combinados com as paletas `OUTPOST.PAL`, `CP.PAL` e `MINE.PAL` usando os parsers `parseDynamixBitmap` e `parseDynamixPalette`.
  - Cache offscreen em elementos `<canvas>` dedicados para troca instantânea de mesa sem recálculo de pixels.
  - Fallback vetorial em degradê escuro com linhas de grade tática e contornos de paredes caso os assets não estejam disponíveis.
  - Renderização das rampas wireframe/habitrails usando curvas quadráticas de Bezier com travessas espaçadas.
  - Animação de impacto dos bumpers com halos luminosos e desvanecimento exponencial controlado por `sim.bumperFlashTimers`.
  - Rebatedores dinâmicos girando precisamente em torno de seus pivôs com contorno de borracha e bucha de aço central.
  - Esferas metálicas com degradê radial simulando cromo refletivo, estrela de brilho especular e rastro luminoso de velocidade.
  - Placar LED estilo Dot-Matrix da Sierra com pontuação pontuada, multiplicador, bolas restantes e letreiro de missões.

---

### 4. Implementação da Interface Win95 & Modais (`src/ui/menu-manager.ts`)
- **Objetivo:** Proporcionar a experiência nostálgica do Windows 95 combinada com os menus e diálogos originais do jogo.
- **Decisões Técnicas:**
  - Menus suspensos clicáveis com fechamento automático ao clicar fora.
  - Diálogos modais com barra de título clássica azul marinho, botão de fechar e rodapé.
  - Gerenciamento de recordes locais (`HISCORES.DAT`) persistidos no `localStorage` com valores padrão baseados nos desenvolvedores originais da Dynamix (Kurt Peters, Rich Carpenter, Mark Reider).
  - Assinatura reativa no `i18n.subscribe()` atualizando todos os rótulos da interface (menus, itens, modais e controles móveis) no instante em que o idioma é alterado.

---

### 5. Ponto de Entrada & Loop de Jogo (`src/main.ts`)
- **Objetivo:** Integrar física, áudio, renderizador, interface de usuário e captura de entradas.
- **Decisões Técnicas:**
  - Mapeamento duplo de teclas (Shift Esquerdo / Z para Flipper Esquerdo; Shift Direito / / para Flipper Direito; Barra de Espaço / Seta Baixo / Enter para o lançador de mola; X / S / C para Nudge).
  - Botões touch integrados com eventos de ponteiro (`pointerdown`, `pointerup`, `pointercancel`, `pointerleave`) para evitar travamentos em telas multitoque.
  - Processamento da fila de eventos da simulação (`sim.events.splice(0)`) a cada quadro do loop, disparando sons espacializados, banners no letreiro e finalização de partida.

---

### 6. Página HTML5 & Estilização Retro (`index.html`)
- **Objetivo:** Montar a estrutura da janela Win95, menus, canvas e área touch para smartphones.
- **Decisões Técnicas:**
  - Efeito chanfrado (bevel) clássico do Windows 95 via sombras internas (`inset 1px 1px #fff, inset -1px -1px #000`).
  - Fonte `MS Sans Serif` / Tahoma com rendering pixelado no canvas (`imageSmoothingEnabled = false`).
  - Painel de botões táteis para celular que se adapta automaticamente quando detecta toque ou largura de tela reduzida (`@media (max-width: 800px), (pointer: coarse)`).

---

### 7. Suíte de Testes Automatizados (`tests/regressions.mjs`)
- **Objetivo:** Garantir que nenhuma alteração quebre os parsers binários, a matemática do WASM ou a máquina de estados da simulação.
- **Suítes Implementadas:**
  1. `[1/5]` Parsers binários Dynamix (PAL, BMP, TBL, RES).
  2. `[2/5]` Dicionários de localização i18n para os 6 idiomas.
  3. `[3/5]` Kernel WebAssembly e projeção geométrica círculo-segmento.
  4. `[4/5]` Integridade geométrica e elementos das 3 mesas.
  5. `[5/5]` Simulação de física, mola de lançamento, flippers, multiball e transição de mesas.
- **Resultado:** Executado via `npm test` (`tsx tests/regressions.mjs`) com **5/5 suítes aprovadas com sucesso**.

---

### 8. Validação da Compilação de Produção
- `npx tsc --noEmit`: 0 erros de tipagem.
- `npm run build` (`tsc && vite build`): bundle final gerado em `dist/` com `index.html` (21.47 kB) e `index-[hash].js` (73.15 kB) em 209ms.

---

### 9. Suporte a Gamepad API & Vibração Háptica Dual-Rumble (`src/input/gamepad-manager.ts`)
- **Objetivo:** Permitir controle nativo via gamepads padrão (Xbox, PlayStation, controles retrô USB) com sensações táteis.
- **Mapeamento:**
  - L1 / L2 / Gatilho Esquerdo: Flipper Esquerdo
  - R1 / R2 / Gatilho Direito: Flipper Direito
  - Botão A / D-Pad Baixo: Carregar e soltar mola de lançamento
  - D-Pad Esquerda/Direita/Cima ou Analógico: Nudge da mesa
  - Botão Start: Pausar
  - Botão Back/Select: Iniciar novo jogo
- **Vibração:** Efeito `dual-rumble` disparado via `vibrationActuator` em impactos de bumpers, explosões, acionamento de flippers e perda de bola (Game Over).

---

### 10. Trilha Sonora Procedimental Adaptativa por Mesa (`src/audio/audio-manager.ts`)
- **Objetivo:** Diferenciar acusticamente cada ambiente espacial:
  - **Colônia Espacial (Outpost):** Escala em Ré menor (D-minor) com arpeggios exploratórios e filtro de 350Hz.
  - **Posto de Comando (Command Post):** Andamento acelerado em Dó menor (C-minor) militar com ressonância de 480Hz.
  - **Mina de Cristais (Mine):** Baixo profundo em Lá menor (A-minor) a 280Hz com harmônicos cristalinos de alta oitava.

---

### 11. Capacidade Offline PWA & Service Worker (`public/manifest.json`, `public/sw.js`)
- **Objetivo:** Permitir instalação do jogo como Progressive Web App (PWA) e execução 100% offline.
- **Arquivos:**
  - `manifest.json`: Ícones, orientação flexível, tema azul marinho retrô (`#000080`), modo `standalone`.
  - `sw.js`: Service Worker com estratégia Cache-First para os arquivos estáticos, paletas, bitmaps e áudios WAV.

---

### 12. Sincronização da Documentação Multilíngue
- Atualização de todas as 6 versões dos READMEs (`README.md`, `README.pt-BR.md`, `README.es.md`, `README.de.md`, `README.zh-CN.md`, `README.ru.md`) com badges de fase 6 e tabelas de progresso 100% concluídas.
