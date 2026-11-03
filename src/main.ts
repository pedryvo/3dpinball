import { AudioManager } from './audio/audio-manager';
import { getTableTranslation, i18n } from './i18n';
import type { TableId } from './i18n/types';
import { PinballSimulation } from './physics/engine';
import { TableRenderer } from './renderer/table-renderer';
import { MenuManager } from './ui/menu-manager';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('pinball-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Pinball canvas not found');
    return;
  }

  // 1. Initialize Core Subsystems
  const audio = new AudioManager();
  const sim = new PinballSimulation('outpost');
  const renderer = new TableRenderer(canvas);

  // 2. Preload Authentic Binary Assets in Background
  renderer.preloadTableAssets().catch((err) => console.warn('Renderer asset preload:', err));
  audio.preloadSounds().catch((err) => console.warn('Audio preload:', err));

  // 3. Setup UI & Win95 Menu Chrome
  const menu = new MenuManager(sim, audio, (tableId: TableId) => {
    sim.selectTable(tableId, false);
    renderer.showBanner(getTableTranslation(i18n.t, tableId).name, 2.5);
  });

  // 4. Keyboard Controls
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
        sim.selectTable('outpost', false);
        break;
      case 'Digit2':
        sim.selectTable('command_post', false);
        break;
      case 'Digit3':
        sim.selectTable('mine', false);
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

  // 6. Game Loop
  let lastTime = performance.now();

  const gameLoop = (currentTime: number) => {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    // Physics step
    sim.step(dt);

    // Process simulation events
    const events = sim.events.splice(0);
    for (const ev of events) {
      if (ev.type === 'sound' && ev.sound) {
        audio.playSound(ev.sound, ev.panX ?? 246);
      } else if (ev.type === 'banner' && ev.bannerKey) {
        const dict = i18n.t;
        const text = (dict.led as Record<string, string>)[ev.bannerKey]
          ?? (dict.hud as Record<string, string>)[ev.bannerKey]
          ?? ev.bannerKey;
        renderer.showBanner(text);
      } else if (ev.type === 'table_change' && ev.tableId) {
        sim.selectTable(ev.tableId, false);
        renderer.showBanner(getTableTranslation(i18n.t, ev.tableId).name);
      } else if (ev.type === 'game_over') {
        menu.recordScoreIfEligible(sim.score, sim.tableId);
        renderer.showBanner(i18n.t.led.gameOver, 5.0);
      }
    }

    // Canvas render
    renderer.render(sim, dt);

    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
});
