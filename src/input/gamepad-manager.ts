import type { PinballSimulation } from '../physics/engine';

export class GamepadManager {
  private sim: PinballSimulation;
  private prevButtons: boolean[] = [];
  private connected = false;
  private lastHapticTime = 0;

  constructor(sim: PinballSimulation) {
    this.sim = sim;
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
        console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
        this.connected = true;
        this.triggerHaptic(0.3, 100);
      });

      window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
        console.log(`Gamepad disconnected from index ${e.gamepad.index}: ${e.gamepad.id}`);
        this.connected = false;
      });
    }
  }

  public update(): void {
    if (typeof navigator === 'undefined') return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp || !gp.connected) return;

    // Standard Gamepad Mapping:
    // Button 4: Left Bumper (L1) / Button 6: Left Trigger (L2) -> Left Flipper
    // Button 5: Right Bumper (R1) / Button 7: Right Trigger (R2) -> Right Flipper
    // Button 0: A / Cross -> Plunger Launch
    // Button 1: B / Circle -> Nudge Up
    // Button 14: D-Pad Left -> Nudge Left
    // Button 15: D-Pad Right -> Nudge Right
    // Button 12: D-Pad Up -> Nudge Up
    // Button 9: Start -> Pause
    // Button 8: Back/Select -> New Game

    const leftFlipper = (gp.buttons[4]?.pressed || gp.buttons[6]?.pressed || gp.buttons[6]?.value > 0.2);
    const rightFlipper = (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed || gp.buttons[7]?.value > 0.2);
    const plunger = gp.buttons[0]?.pressed || gp.buttons[13]?.pressed; // A or D-Pad Down
    const nudgeLeft = gp.buttons[14]?.pressed || (gp.axes[0] < -0.6);
    const nudgeRight = gp.buttons[15]?.pressed || (gp.axes[0] > 0.6);
    const nudgeUp = gp.buttons[12]?.pressed || gp.buttons[1]?.pressed || (gp.axes[1] < -0.6);
    const pause = gp.buttons[9]?.pressed;
    const newGame = gp.buttons[8]?.pressed;

    // Flippers
    this.sim.setFlipperPressed('left', !!leftFlipper);
    this.sim.setFlipperPressed('right', !!rightFlipper);

    // Plunger
    this.sim.setPlungerCharging(!!plunger);

    // Nudge edge detection
    if (nudgeLeft && !this.prevButtons[14]) {
      this.sim.nudge(-1, 0);
      this.triggerHaptic(0.4, 80);
    }
    if (nudgeRight && !this.prevButtons[15]) {
      this.sim.nudge(1, 0);
      this.triggerHaptic(0.4, 80);
    }
    if (nudgeUp && !this.prevButtons[12]) {
      this.sim.nudge(0, -1);
      this.triggerHaptic(0.4, 80);
    }

    // Pause edge detection
    if (pause && !this.prevButtons[9]) {
      this.sim.paused = !this.sim.paused;
    }

    // New Game edge detection
    if (newGame && !this.prevButtons[8]) {
      this.sim.startNewGame();
    }

    // Store state
    this.prevButtons[14] = !!nudgeLeft;
    this.prevButtons[15] = !!nudgeRight;
    this.prevButtons[12] = !!nudgeUp;
    this.prevButtons[9] = !!pause;
    this.prevButtons[8] = !!newGame;
  }

  public triggerHaptic(intensity = 0.5, durationMs = 80): void {
    if (typeof performance === 'undefined' || typeof navigator === 'undefined') return;
    const now = performance.now();
    if (now - this.lastHapticTime < 50) return;
    this.lastHapticTime = now;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const act = (gp as unknown as { vibrationActuator?: { playEffect: (type: string, opts: object) => Promise<unknown> } }).vibrationActuator;
    if (act && typeof act.playEffect === 'function') {
      act.playEffect('dual-rumble', {
        startDelay: 0,
        duration: durationMs,
        weakMagnitude: intensity,
        strongMagnitude: intensity * 0.8,
      }).catch(() => {});
    }
  }
}
