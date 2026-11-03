import { parseDynamixBitmap, parseDynamixPalette } from '../archive/parser';
import { getTableTranslation, i18n } from '../i18n';
import type { TableId } from '../i18n/types';
import type { FlipperState, PinballBall, PinballSimulation } from '../physics/engine';
import { BitmapFontRenderer } from './bitmap-font';
import { ParticleSystem } from './particle-system';

export class TableRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tableCanvases = new Map<TableId, HTMLCanvasElement>();
  private animatedSpriteFrames = new Map<TableId, HTMLCanvasElement[]>();
  private bannerText = '';
  private bannerTimer = 0;
  private marqueeOffset = 0;
  private animTimer = 0;
  public particles = new ParticleSystem();
  private bitmapFont = new BitmapFontRenderer();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  public async preloadTableAssets(): Promise<void> {
    // Preload authentic Sierra LED scoreboard bitmap fonts
    this.bitmapFont.preloadFontAssets().catch(() => {});

    const tableConfigs: Array<{ id: TableId; bmp: string; pal: string; animBmp: string }> = [
      { id: 'outpost', bmp: '/assets/OUTPOSTJ.BMP', pal: '/assets/OUTPOST.PAL', animBmp: '/assets/OUTPOST2.BMP' },
      { id: 'command_post', bmp: '/assets/CPJ.BMP', pal: '/assets/CP.PAL', animBmp: '/assets/CP2.BMP' },
      { id: 'mine', bmp: '/assets/MINEJ.BMP', pal: '/assets/MINE.PAL', animBmp: '/assets/MINE2.BMP' },
    ];

    await Promise.all(
      tableConfigs.map(async (cfg) => {
        try {
          const [bmpRes, palRes, animRes] = await Promise.all([
            fetch(cfg.bmp),
            fetch(cfg.pal),
            fetch(cfg.animBmp).catch(() => null),
          ]);
          if (!bmpRes.ok || !palRes.ok) return;

          const bmpBuf = await bmpRes.arrayBuffer();
          const palBuf = await palRes.arrayBuffer();

          const palette = parseDynamixPalette(palBuf);
          const bitmap = parseDynamixBitmap(bmpBuf);

          if (bitmap.frames.length > 0) {
            const frame = bitmap.frames[0];
            const offscreen = document.createElement('canvas');
            offscreen.width = frame.width;
            offscreen.height = frame.height;
            const offCtx = offscreen.getContext('2d');
            if (offCtx) {
              const imgData = offCtx.createImageData(frame.width, frame.height);
              const data32 = new Uint32Array(imgData.data.buffer);
              const pix = frame.pixels;
              const len = Math.min(pix.length, data32.length);

              for (let i = 0; i < len; i++) {
                const colorIdx = pix[i];
                data32[i] = palette.rgba32[colorIdx];
              }
              offCtx.putImageData(imgData, 0, 0);
              this.tableCanvases.set(cfg.id, offscreen);
            }
          }

          // Preload animation frames
          if (animRes && animRes.ok) {
            const animBuf = await animRes.arrayBuffer();
            const animBmp = parseDynamixBitmap(animBuf);
            const frames: HTMLCanvasElement[] = [];

            for (const f of animBmp.frames) {
              const fCanvas = document.createElement('canvas');
              fCanvas.width = f.width;
              fCanvas.height = f.height;
              const fCtx = fCanvas.getContext('2d');
              if (fCtx) {
                const imgData = fCtx.createImageData(f.width, f.height);
                const data32 = new Uint32Array(imgData.data.buffer);
                const pix = f.pixels;
                const len = Math.min(pix.length, data32.length);
                for (let i = 0; i < len; i++) {
                  const colorIdx = pix[i];
                  // If color index is 0, make it transparent
                  if (colorIdx === 0) {
                    data32[i] = 0x00000000;
                  } else {
                    data32[i] = palette.rgba32[colorIdx];
                  }
                }
                fCtx.putImageData(imgData, 0, 0);
                frames.push(fCanvas);
              }
            }
            if (frames.length > 0) {
              this.animatedSpriteFrames.set(cfg.id, frames);
            }
          }
        } catch {
          // If fetch fails (e.g. offline), the vector fallback table renders
        }
      })
    );
  }

  public showBanner(text: string, durationSec = 3.5): void {
    this.bannerText = text;
    this.bannerTimer = durationSec;
    this.marqueeOffset = 0;
  }

  public render(sim: PinballSimulation, dt = 0.016): void {
    if (this.bannerTimer > 0) {
      this.bannerTimer = Math.max(0, this.bannerTimer - dt);
      this.marqueeOffset += dt * 60;
    }

    const { ctx } = this;
    ctx.save();

    // Table nudge shake effect
    ctx.translate(sim.nudgeOffsetX, sim.nudgeOffsetY);

    // 1. Draw Table Background
    const bgCanvas = this.tableCanvases.get(sim.tableId);
    if (bgCanvas) {
      ctx.drawImage(bgCanvas, 0, 0, 640, 480);
    } else {
      this.renderProceduralTableBackdrop(sim);
    }

    // 1.5 Draw Authentic Animated Table Sprites (Radar, Scanner, Extraction Gear)
    this.animTimer += dt;
    const animFrames = this.animatedSpriteFrames.get(sim.tableId);
    if (animFrames && animFrames.length > 0) {
      const frameIdx = Math.floor((this.animTimer * 10) % animFrames.length);
      const spriteCanvas = animFrames[frameIdx];
      if (spriteCanvas) {
        const posX = sim.tableId === 'outpost' ? 218 : (sim.tableId === 'command_post' ? 222 : 216);
        const posY = 100;
        ctx.drawImage(spriteCanvas, posX, posY);
      }
    }

    // 2. Draw Table Wire Ramps & Habitrail Guide Rails
    this.renderRamps(sim);

    // 3. Draw Targets & Drop Target Banks
    this.renderTargets(sim);

    // 4. Draw Bumpers with dynamic hit animations
    this.renderBumpers(sim);

    // 5. Draw Sinkholes
    this.renderSinkholes(sim);

    // 5.5 Draw Playfield Multiplier & Ball Save Lamps
    this.renderPlayfieldLamps(sim);

    // 6. Draw Plunger Spring
    this.renderPlunger(sim);

    // 7. Draw Flippers
    for (const flipper of sim.flippers) {
      this.renderFlipper(flipper);
    }

    // 8. Draw Balls & Motion Trails
    for (const ball of sim.balls) {
      if (ball.active) {
        this.renderBall(ball);
      }
    }

    // 9. Update & Draw Sci-Fi Collision Particles & Energy Sparks
    this.particles.update(dt);
    this.particles.render(ctx);

    // 10. Draw Tilt Overlay
    if (sim.tilted) {
      this.renderTiltWarning();
    }

    // 11. Draw Sierra / Dynamix LED Scoreboard HUD
    this.renderScoreboard(sim);

    ctx.restore();
  }

  private renderProceduralTableBackdrop(sim: PinballSimulation): void {
    const { ctx } = this;
    const grad = ctx.createLinearGradient(0, 0, 480, 480);

    if (sim.tableId === 'outpost') {
      grad.addColorStop(0, '#0a0d1e');
      grad.addColorStop(0.5, '#121833');
      grad.addColorStop(1, '#060814');
    } else if (sim.tableId === 'command_post') {
      grad.addColorStop(0, '#1a1008');
      grad.addColorStop(0.5, '#2e1c10');
      grad.addColorStop(1, '#0d0703');
    } else {
      grad.addColorStop(0, '#061814');
      grad.addColorStop(0.5, '#0c2e26');
      grad.addColorStop(1, '#030d0a');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 480);

    // Background tactical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 30; x < 460; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 30; y < 480; y += 30) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(460, y);
      ctx.stroke();
    }

    // Draw Boundary Walls
    ctx.strokeStyle = '#5c7094';
    ctx.lineWidth = 4;
    for (const wall of sim.table.walls) {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    }
  }

  private renderRamps(sim: PinballSimulation): void {
    const { ctx } = this;
    ctx.save();
    for (const ramp of sim.table.ramps) {
      // Habitrail wire rail 1
      ctx.strokeStyle = 'rgba(200, 225, 255, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ramp.entryX - 6, ramp.entryY);
      ctx.quadraticCurveTo(ramp.controlX - 6, ramp.controlY, ramp.exitX - 6, ramp.exitY);
      ctx.stroke();

      // Habitrail wire rail 2
      ctx.beginPath();
      ctx.moveTo(ramp.entryX + 6, ramp.entryY);
      ctx.quadraticCurveTo(ramp.controlX + 6, ramp.controlY, ramp.exitX + 6, ramp.exitY);
      ctx.stroke();

      // Crossbars
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let t = 0.15; t <= 0.85; t += 0.15) {
        const u = 1 - t;
        const x1 = u * u * (ramp.entryX - 6) + 2 * u * t * (ramp.controlX - 6) + t * t * (ramp.exitX - 6);
        const y1 = u * u * ramp.entryY + 2 * u * t * ramp.controlY + t * t * ramp.exitY;
        const x2 = u * u * (ramp.entryX + 6) + 2 * u * t * (ramp.controlX + 6) + t * t * (ramp.exitX + 6);
        const y2 = u * u * ramp.entryY + 2 * u * t * ramp.controlY + t * t * ramp.exitY;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderTargets(sim: PinballSimulation): void {
    const { ctx } = this;
    for (const target of sim.table.targets) {
      const isLit = sim.litTargets.has(target.id);
      ctx.save();

      // Base target housing
      ctx.fillStyle = '#1e2430';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius + 2, 0, Math.PI * 2);
      ctx.fill();

      // Lit lens
      ctx.fillStyle = isLit ? target.color : '#3a4454';
      if (isLit) {
        ctx.shadowColor = target.color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fill();

      // Lens specular reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(target.x - target.radius * 0.3, target.y - target.radius * 0.3, target.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderBumpers(sim: PinballSimulation): void {
    const { ctx } = this;
    for (const b of sim.table.bumpers) {
      const flash = sim.bumperFlashTimers.get(b.id) ?? 0;
      const isFlashing = flash > 0;

      ctx.save();
      // Outer bumper ring
      ctx.fillStyle = isFlashing ? '#ffffff' : '#222838';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
      ctx.fill();

      // Bumper body with illumination glow
      ctx.fillStyle = isFlashing ? '#ffea00' : b.color;
      if (isFlashing) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Dome cap
      const domeGrad = ctx.createRadialGradient(
        b.x - b.radius * 0.3,
        b.y - b.radius * 0.3,
        1,
        b.x,
        b.y,
        b.radius * 0.8
      );
      domeGrad.addColorStop(0, '#ffffff');
      domeGrad.addColorStop(0.4, isFlashing ? '#ffef8a' : b.color);
      domeGrad.addColorStop(1, '#111520');

      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.72, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderSinkholes(sim: PinballSimulation): void {
    const { ctx } = this;
    for (const sink of sim.table.sinkholes) {
      ctx.save();
      // Hole opening
      ctx.fillStyle = '#050508';
      ctx.beginPath();
      ctx.arc(sink.x, sink.y, sink.radius, 0, Math.PI * 2);
      ctx.fill();

      // Metal rim
      ctx.strokeStyle = '#8c9cb0';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderPlayfieldLamps(sim: PinballSimulation): void {
    const { ctx } = this;
    ctx.save();

    // 1. Multiplier Inserts (2X, 3X, 5X, 10X) in center lower table
    const multipliers = [
      { val: 2, x: 200, y: 318, label: '2X' },
      { val: 3, x: 227, y: 308, label: '3X' },
      { val: 5, x: 253, y: 308, label: '5X' },
      { val: 10, x: 280, y: 318, label: '10X' },
    ];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const m of multipliers) {
      const isLit = sim.multiplier >= m.val;

      // Lamp housing
      ctx.fillStyle = isLit ? 'rgba(255, 180, 0, 0.25)' : 'rgba(15, 22, 35, 0.6)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 9, 0, Math.PI * 2);
      ctx.fill();

      // Lamp rim
      ctx.strokeStyle = isLit ? '#ffd040' : '#304055';
      ctx.lineWidth = 1.5;
      if (isLit) {
        ctx.shadowColor = '#ffbb00';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Lamp lens inner glow
      if (isLit) {
        ctx.fillStyle = '#ffea66';
      } else {
        ctx.fillStyle = '#405268';
      }
      ctx.font = 'bold 9px monospace';
      ctx.fillText(m.label, m.x, m.y + 0.5);
    }
    ctx.shadowBlur = 0;

    // 2. Ball Save Lamp & Shield Barrier
    if (sim.ballSaveTimer > 0) {
      // If expiring (< 2s), flash at 8Hz
      const flash = sim.ballSaveTimer > 2.0 || Math.floor(sim.ballSaveTimer * 8) % 2 === 0;

      if (flash) {
        // Oval Insert Lamp: "BALL SAVE"
        ctx.fillStyle = 'rgba(0, 255, 200, 0.22)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.ellipse(240, 345, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('BALL SAVE', 240, 345.5);

        // Futuristic Holographic Energy Barrier across the drain
        ctx.beginPath();
        ctx.moveTo(195, 452);
        ctx.quadraticCurveTo(240, 464, 285, 452);
        ctx.strokeStyle = 'rgba(0, 255, 220, 0.85)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Energy shield nodes
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(195, 452, 3, 0, Math.PI * 2);
        ctx.arc(285, 452, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Inactive dark insert
      ctx.fillStyle = 'rgba(15, 22, 35, 0.5)';
      ctx.strokeStyle = '#253545';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(240, 345, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3a4e62';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('BALL SAVE', 240, 345.5);
    }

    ctx.restore();
  }

  private renderPlunger(sim: PinballSimulation): void {
    const { ctx } = this;
    const laneX = sim.table.launchX;
    const restY = sim.table.launchY + 16;
    const maxCompress = 38;
    const currentY = restY + sim.plungerCharge * maxCompress;

    ctx.save();
    // Plunger shaft
    ctx.strokeStyle = '#a4b2c6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(laneX, currentY);
    ctx.lineTo(laneX, restY + maxCompress + 18);
    ctx.stroke();

    // Coiled Spring
    ctx.strokeStyle = '#e2b024';
    ctx.lineWidth = 2.5;
    const coils = 6;
    const coilHeight = (restY + maxCompress + 16 - currentY) / coils;
    ctx.beginPath();
    ctx.moveTo(laneX, currentY);
    for (let c = 0; c < coils; c++) {
      const cy = currentY + c * coilHeight;
      ctx.lineTo(laneX - 5, cy + coilHeight * 0.3);
      ctx.lineTo(laneX + 5, cy + coilHeight * 0.7);
      ctx.lineTo(laneX, cy + coilHeight);
    }
    ctx.stroke();

    // Plunger rubber tip
    ctx.fillStyle = '#d03030';
    ctx.beginPath();
    ctx.arc(laneX, currentY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderFlipper(f: FlipperState): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(f.pivotX, f.pivotY);
    ctx.rotate(f.angleRad);

    const len = f.length;
    const r1 = f.radius;
    const r2 = f.radius * 0.42;

    // Flipper shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(3, 4, r1, Math.PI / 2, -Math.PI / 2, false);
    ctx.lineTo(len + 3, 4 - r2);
    ctx.arc(len + 3, 4, r2, -Math.PI / 2, Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();

    // Flipper body
    const grad = ctx.createLinearGradient(0, -r1, 0, r1);
    grad.addColorStop(0, '#f2f2f2');
    grad.addColorStop(0.3, '#ffffff');
    grad.addColorStop(0.7, '#d81b24');
    grad.addColorStop(1, '#8e0e14');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r1, Math.PI / 2, -Math.PI / 2, false);
    ctx.lineTo(len, -r2);
    ctx.arc(len, 0, r2, -Math.PI / 2, Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();

    // Flipper Rubber Band Outline
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flipper Pivot Bushing
    ctx.fillStyle = '#222933';
    ctx.beginPath();
    ctx.arc(0, 0, r1 * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0d0e0';
    ctx.beginPath();
    ctx.arc(0, 0, r1 * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBall(ball: PinballBall): void {
    const { ctx } = this;
    ctx.save();

    // Motion trail for speed
    if (ball.trail.length > 1) {
      for (let i = 0; i < ball.trail.length; i++) {
        const pt = ball.trail[i];
        const alpha = (1 - i / ball.trail.length) * 0.28;
        const rad = ball.radius * (1 - (i / ball.trail.length) * 0.4);
        ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ball table contact drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 3, ball.y + 4, ball.radius, ball.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chrome spherical gradient
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.38,
      ball.y - ball.radius * 0.38,
      ball.radius * 0.1,
      ball.x,
      ball.y,
      ball.radius
    );
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.25, '#e8f0fe');
    ballGrad.addColorStop(0.65, '#90a4ae');
    ballGrad.addColorStop(1, '#263238');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Specular star highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, ball.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderTiltWarning(): void {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 30, 30, 0.88)';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 14;
    ctx.fillText('T I L T', 240, 240);
    ctx.restore();
  }

  private renderScoreboard(sim: PinballSimulation): void {
    const { ctx } = this;
    const dict = i18n.t;
    const tableI18n = getTableTranslation(dict, sim.tableId);

    // HUD Panel in top right area (x: 480..640, y: 0..480)
    ctx.save();

    // Bezel border
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(480, 0, 160, 480);
    ctx.strokeStyle = '#2b3446';
    ctx.lineWidth = 2;
    ctx.strokeRect(481, 1, 158, 478);

    // Sierra / Dynamix LED Display Screen Frame
    ctx.fillStyle = '#04070a';
    ctx.fillRect(486, 10, 148, 140);
    ctx.strokeStyle = '#142232';
    ctx.strokeRect(486, 10, 148, 140);

    // LED Score Display
    ctx.font = '10px monospace';
    ctx.fillStyle = '#5680a6';
    ctx.fillText(dict.hud.score.toUpperCase(), 492, 26);

    const formattedScore = sim.score.toLocaleString('en-US');
    const drewBitmapScore = this.bitmapFont.drawScore(ctx, formattedScore, 492, 34);

    if (!drewBitmapScore) {
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 8;
      ctx.fillText(formattedScore, 492, 50);
      ctx.shadowBlur = 0;
    }

    // LED Multiplier & Balls Remaining
    ctx.shadowBlur = 0;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#5680a6';
    ctx.fillText(dict.hud.ball.toUpperCase(), 492, 74);
    ctx.fillText(dict.hud.multiplier.toUpperCase(), 570, 74);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ffbb00';
    ctx.fillText(`${sim.ballsRemaining} / 3`, 492, 94);
    ctx.fillText(`${sim.multiplier}X`, 570, 94);

    // Sector / Table Indicator
    ctx.font = '10px monospace';
    ctx.fillStyle = '#5680a6';
    ctx.fillText(dict.hud.activeTable.toUpperCase(), 492, 116);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#00d0ff';
    ctx.fillText(tableI18n.name.toUpperCase(), 492, 134);

    // Scrolling Marquee / Mission Objectives Display
    ctx.fillStyle = '#03080e';
    ctx.fillRect(486, 160, 148, 130);
    ctx.strokeStyle = '#1e3852';
    ctx.strokeRect(486, 160, 148, 130);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#ff6b35';
    ctx.fillText(dict.hud.missionStatus.toUpperCase(), 492, 178);

    ctx.fillStyle = '#e2f0ff';
    ctx.font = '11px sans-serif';

    // Display banner text or active mission description
    const textToShow = this.bannerTimer > 0 && this.bannerText
      ? this.bannerText
      : tableI18n.description;

    this.renderWrappedText(textToShow, 492, 196, 136, 15);

    // Mini Tactical Status LEDs
    ctx.fillStyle = '#162232';
    ctx.fillRect(486, 300, 148, 170);
    ctx.strokeStyle = '#22384e';
    ctx.strokeRect(486, 300, 148, 170);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#5680a6';
    ctx.fillText(dict.hud.targetsHit.toUpperCase(), 492, 318);

    const targets = sim.table.targets.slice(0, 5);
    let ty = 336;
    for (const t of targets) {
      const isLit = sim.litTargets.has(t.id);
      ctx.fillStyle = isLit ? '#00ff66' : '#2d4254';
      ctx.beginPath();
      ctx.arc(498, ty - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isLit ? '#ffffff' : '#72889e';
      ctx.font = '10px monospace';
      ctx.fillText(t.label.toUpperCase(), 510, ty);
      ty += 16;
    }

    // Launch Instructions
    if (sim.balls.some((b) => b.active && b.inPlungerLane)) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(dict.hud.pressSpaceToLaunch.toUpperCase(), 492, 456);
    }

    ctx.restore();
  }

  private renderWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const { ctx } = this;
    const words = text.split(' ');
    let line = '';
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
        if (currY > y + 80) break; // Keep within box
      } else {
        line = testLine;
      }
    }
    if (line && currY <= y + 80) {
      ctx.fillText(line, x, currY);
    }
  }
}
