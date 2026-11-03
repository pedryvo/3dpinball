import { AudioManager } from './audio/audio-manager';
import { parseDynamixBitmap, parseDynamixPalette } from './archive/parser';
import { getTableTranslation, i18n } from './i18n';
import type { TableId } from './i18n/types';
import { GamepadManager } from './input/gamepad-manager';
import { PinballSimulation } from './physics/engine';
import { TableRenderer } from './renderer/table-renderer';
import { MenuManager } from './ui/menu-manager';

async function initGame(): Promise<void> {
  const canvas = document.getElementById('pinball-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Pinball canvas not found');
    return;
  }

  // 1. Dynamic Canvas Responsive Sizing (100% width/height of viewport)
  const resizeCanvasToFit = () => {
    const container = canvas.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;

    const targetAspect = 640 / 480; // 4:3
    const containerAspect = w / h;

    let canvasWidth: number;
    let canvasHeight: number;

    if (containerAspect > targetAspect) {
      canvasHeight = h;
      canvasWidth = Math.floor(h * targetAspect);
    } else {
      canvasWidth = w;
      canvasHeight = Math.floor(w / targetAspect);
    }

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const resPanel = document.getElementById('status-res');
    if (resPanel) {
      resPanel.textContent = `${canvasWidth}×${canvasHeight}`;
    }
  };

  window.addEventListener('resize', resizeCanvasToFit);
  if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
    new ResizeObserver(resizeCanvasToFit).observe(canvas.parentElement);
  }
  resizeCanvasToFit();
  setTimeout(resizeCanvasToFit, 50);

  // 2. Initialize Core Subsystems
  const audio = new AudioManager();
  const sim = new PinballSimulation('outpost');
  const renderer = new TableRenderer(canvas);
  const gamepad = new GamepadManager(sim);

  // 3. Preload Authentic Binary Assets in Background
  renderer.preloadTableAssets().catch((err) => console.warn('Renderer asset preload:', err));
  audio.preloadSounds().catch((err) => console.warn('Audio preload:', err));

  // Audio start on first user interaction anywhere
  const initAudioOnce = () => {
    audio.ensureContext();
    if (audio.isMusicOn()) {
      audio.startMusic();
    }
    window.removeEventListener('pointerdown', initAudioOnce);
    window.removeEventListener('keydown', initAudioOnce);
  };
  window.addEventListener('pointerdown', initAudioOnce);
  window.addEventListener('keydown', initAudioOnce);

  // 4. Retro Intro Modal loader
  const splashCanvas = document.getElementById('splash-canvas') as HTMLCanvasElement | null;
  const loadSplashLogo = async () => {
    if (!splashCanvas) return;
    try {
      const [palRes, bmpRes] = await Promise.all([
        fetch('/assets/LOGO.PAL'),
        fetch('/assets/LOGO.BMP'),
      ]);
      if (!palRes.ok || !bmpRes.ok) return;
      const palette = parseDynamixPalette(await palRes.arrayBuffer());
      const bitmap = parseDynamixBitmap(await bmpRes.arrayBuffer());
      if (bitmap.frames.length > 0) {
        const frame = bitmap.frames[0];
        const ctx = splashCanvas.getContext('2d');
        if (ctx) {
          const imgData = ctx.createImageData(frame.width, frame.height);
          const data32 = new Uint32Array(imgData.data.buffer);
          const pix = frame.pixels;
          for (let i = 0; i < pix.length; i++) {
            data32[i] = palette.rgba32[pix[i]];
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }
    } catch {
      // Fallback
    }
  };
  loadSplashLogo().catch(() => {});

  // 5. Setup UI & Win95 Menu Chrome
  const switchTable = (tableId: TableId) => {
    sim.selectTable(tableId, false);
    audio.setTableMusicTheme(tableId);
    renderer.showBanner(getTableTranslation(i18n.t, tableId).name, 2.5);
  };

  const menu = new MenuManager(
    sim,
    audio,
    (tableId: TableId) => {
      switchTable(tableId);
    },
    () => {
      menu.openModal('modal-intro');
    }
  );

  // 6. Keyboard Controls
  const activeKeys = new Set<string>();

  const handleKeyDown = (e: KeyboardEvent) => {
    audio.ensureContext();
    if (activeKeys.has(e.code)) return;
    activeKeys.add(e.code);

    switch (e.code) {
      // Left Flipper
      case 'ShiftLeft':
      case 'KeyZ':
      case 'KeyA':
        e.preventDefault();
        sim.setFlipperPressed('left', true);
        break;

      // Right Flipper
      case 'ShiftRight':
      case 'Slash':
      case 'KeyM':
        e.preventDefault();
        sim.setFlipperPressed('right', true);
        break;

      // Plunger Launch
      case 'Space':
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault();
        sim.setPlungerCharging(true);
        break;

      // Nudge Keys
      case 'KeyX':
      case 'ArrowLeft':
        e.preventDefault();
        sim.nudge(-1, 0);
        break;
      case 'KeyC':
      case 'ArrowRight':
        e.preventDefault();
        sim.nudge(1, 0);
        break;
      case 'KeyS':
      case 'ArrowUp':
        e.preventDefault();
        sim.nudge(0, -1);
        break;

      // Game State Controls
      case 'KeyP':
      case 'Escape':
        e.preventDefault();
        sim.paused = !sim.paused;
        break;
      case 'F2':
        e.preventDefault();
        sim.startNewGame();
        break;

      // Table Selection Shortcuts
      case 'Digit1':
        switchTable('outpost');
        break;
      case 'Digit2':
        switchTable('command_post');
        break;
      case 'Digit3':
        switchTable('mine');
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    activeKeys.delete(e.code);

    switch (e.code) {
      case 'ShiftLeft':
      case 'KeyZ':
      case 'KeyA':
        sim.setFlipperPressed('left', false);
        break;

      case 'ShiftRight':
      case 'Slash':
      case 'KeyM':
        sim.setFlipperPressed('right', false);
        break;

      case 'Space':
      case 'ArrowDown':
      case 'Enter':
        sim.setPlungerCharging(false);
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // 5. Mobile & On-Screen Touch Controls
  const setupTouchBtn = (
    id: string,
    onPress: () => void,
    onRelease: () => void
  ) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const start = (e: Event) => {
      e.preventDefault();
      audio.ensureContext();
      btn.classList.add('active');
      onPress();
    };

    const stop = (e: Event) => {
      e.preventDefault();
      btn.classList.remove('active');
      onRelease();
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('pointerleave', stop);
  };

  setupTouchBtn(
    'btn-touch-flipper-left',
    () => sim.setFlipperPressed('left', true),
    () => sim.setFlipperPressed('left', false)
  );

  setupTouchBtn(
    'btn-touch-flipper-right',
    () => sim.setFlipperPressed('right', true),
    () => sim.setFlipperPressed('right', false)
  );

  setupTouchBtn(
    'btn-touch-plunger',
    () => sim.setPlungerCharging(true),
    () => sim.setPlungerCharging(false)
  );

  const setupTapBtn = (id: string, action: () => void) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      audio.ensureContext();
      action();
    });
  };

  setupTapBtn('btn-touch-nudge-left', () => sim.nudge(-1, 0));
  setupTapBtn('btn-touch-nudge-up', () => sim.nudge(0, -1));
  setupTapBtn('btn-touch-nudge-right', () => sim.nudge(1, 0));

  // 7. Game Loop
  let lastTime = performance.now();

  const gameLoop = (currentTime: number) => {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    // Gamepad controller input polling
    gamepad.update();

    // Physics step
    sim.step(dt);

    // Process simulation events
    const events = sim.events.splice(0);
    for (const ev of events) {
      if (ev.type === 'sound' && ev.sound) {
        audio.playSound(ev.sound, ev.panX ?? 246);
        const px = ev.panX ?? 240;
        if (ev.sound.includes('ZAP')) {
          gamepad.triggerHaptic(0.6, 120);
          renderer.particles.emitRingBurst(px, 140, '#00ffff', 20);
        } else if (ev.sound.includes('EXPLO')) {
          gamepad.triggerHaptic(0.7, 180);
          renderer.particles.emitSparks(px, 150, '#ff4400', 25, 200);
        } else if (ev.sound.includes('SCORE') || ev.sound.includes('CRYSTAL')) {
          renderer.particles.emitSparks(px, 160, '#ffea00', 14, 120);
        } else if (ev.sound.includes('KACHUNK') || ev.sound.includes('FLIPPER')) {
          gamepad.triggerHaptic(0.35, 60);
          renderer.particles.emitSparks(px, 340, '#ff8800', 8, 80);
        }
      } else if (ev.type === 'banner' && ev.bannerKey) {
        const dict = i18n.t;
        const text = (dict.led as Record<string, string>)[ev.bannerKey]
          ?? (dict.hud as Record<string, string>)[ev.bannerKey]
          ?? ev.bannerKey;
        renderer.showBanner(text);
      } else if (ev.type === 'table_change' && ev.tableId) {
        switchTable(ev.tableId);
      } else if (ev.type === 'game_over') {
        gamepad.triggerHaptic(0.8, 250);
        menu.recordScoreIfEligible(sim.score, sim.tableId);
        renderer.showBanner(i18n.t.led.gameOver, 5.0);
      }
    }

    // Canvas render
    renderer.render(sim, dt);

    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGame().catch(console.error);
    });
  } else {
    initGame().catch(console.error);
  }
}
