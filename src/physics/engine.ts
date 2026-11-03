import type { TableId } from '../i18n/types';
import { TABLES, TABLE_ORDER } from '../tables/tables';
import type { TableDefinition } from '../tables/types';
import { getWasmPhysicsKernel, projectPointOntoSegment } from './wasm-physics';

export interface BallTrailPoint {
  x: number;
  y: number;
  z: number;
}

export interface PinballBall {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  inPlungerLane: boolean;
  rampId: string | null;
  rampT: number;
  sinkholeId: string | null;
  sinkholeTimer: number;
  trail: BallTrailPoint[];
}

export interface FlipperState {
  id: string;
  side: 'left' | 'right';
  pivotX: number;
  pivotY: number;
  length: number;
  radius: number;
  restAngleRad: number;
  activeAngleRad: number;
  angleRad: number;
  angularVelocity: number;
  pressed: boolean;
}

export interface EngineEvent {
  type: 'sound' | 'banner' | 'table_change' | 'multiball' | 'game_over';
  sound?: string;
  panX?: number;
  bannerKey?: string;
  bannerText?: string;
  tableId?: TableId;
}

export class PinballSimulation {
  public tableId: TableId = 'outpost';
  public table: TableDefinition = TABLES.outpost;
  public score = 0;
  public ballsRemaining = 3;
  public multiplier = 1;
  public sectorLevel = 1;
  public balls: PinballBall[] = [];
  public flippers: FlipperState[] = [];
  public litTargets = new Set<string>();
  public completedGroups = new Set<string>();
  public bumperFlashTimers = new Map<string, number>();
  public plungerCharge = 0;
  public plungerCharging = false;
  public tiltWarnings = 0;
  public tilted = false;
  public paused = false;
  public gameOver = false;
  public nudgeOffsetX = 0;
  public nudgeOffsetY = 0;
  public ballSaveTimer = 0;
  public events: EngineEvent[] = [];

  private nextBallId = 1;

  constructor(initialTable: TableId = 'outpost') {
    this.selectTable(initialTable, true);
  }

  public selectTable(tableId: TableId, resetMatch = true): void {
    this.tableId = tableId;
    this.table = TABLES[tableId];
    this.litTargets.clear();
    this.completedGroups.clear();
    this.bumperFlashTimers.clear();

    this.flippers = this.table.flippers.map((f) => {
      const restAngleRad = (f.restAngleDeg * Math.PI) / 180;
      const activeAngleRad = (f.activeAngleDeg * Math.PI) / 180;
      return {
        id: f.id,
        side: f.side,
        pivotX: f.pivotX,
        pivotY: f.pivotY,
        length: f.length,
        radius: f.radius,
        restAngleRad,
        activeAngleRad,
        angleRad: restAngleRad,
        angularVelocity: 0,
        pressed: false,
      };
    });

    if (resetMatch) {
      this.score = 0;
      this.ballsRemaining = 3;
      this.multiplier = 1;
      this.sectorLevel = 1;
      this.gameOver = false;
    }

    this.spawnBallInPlunger();
  }

  public startNewGame(tableId?: TableId): void {
    this.selectTable(tableId ?? this.tableId, true);
    this.events.push({ type: 'sound', sound: 'FANFARE1.WAV', panX: 246 });
    this.events.push({ type: 'banner', bannerKey: 'shootAgain' });
  }

  public spawnBallInPlunger(): void {
    this.tilted = false;
    this.tiltWarnings = 0;
    this.plungerCharge = 0;
    this.plungerCharging = false;
    this.balls = [
      {
        id: this.nextBallId++,
        x: this.table.launchX,
        y: this.table.launchY,
        z: 0,
        vx: 0,
        vy: 0,
        radius: 8,
        active: true,
        inPlungerLane: true,
        rampId: null,
        rampT: 0,
        sinkholeId: null,
        sinkholeTimer: 0,
        trail: [],
      },
    ];
  }

  public spawnMultiball(): void {
    if (this.balls.filter((b) => b.active).length >= 3) {
      return;
    }
    this.balls.push({
      id: this.nextBallId++,
      x: 240,
      y: 96,
      z: 1,
      vx: (Math.random() - 0.5) * 220,
      vy: 185,
      radius: 8,
      active: true,
      inPlungerLane: false,
      rampId: null,
      rampT: 0,
      sinkholeId: null,
      sinkholeTimer: 0,
      trail: [],
    });
    this.ballSaveTimer = 10;
    this.events.push({ type: 'sound', sound: 'FANFARE2.WAV', panX: 240 });
    this.events.push({ type: 'multiball', bannerKey: 'multiballActive' });
  }

  public setFlipperPressed(side: 'left' | 'right', pressed: boolean): void {
    if (this.tilted || this.paused || this.gameOver) {
      for (const f of this.flippers) {
        if (f.side === side) f.pressed = false;
      }
      return;
    }
    let changed = false;
    for (const f of this.flippers) {
      if (f.side === side) {
        if (f.pressed !== pressed && pressed) {
          changed = true;
        }
        f.pressed = pressed;
      }
    }
    if (changed) {
      this.events.push({
        type: 'sound',
        sound: 'FLIPPER.WAV',
        panX: side === 'left' ? 140 : 340,
      });
    }
  }

  public setPlungerCharging(charging: boolean): void {
    if (this.paused || this.gameOver) return;
    if (charging) {
      this.plungerCharging = true;
    } else if (this.plungerCharging) {
      this.releasePlunger();
    }
  }

  public releasePlunger(): void {
    this.plungerCharging = false;
    const charge = Math.max(0.28, this.plungerCharge);
    this.plungerCharge = 0;

    let launched = false;
    for (const ball of this.balls) {
      if (ball.active && (ball.inPlungerLane || (ball.x > 446 && ball.y > 360))) {
        ball.vy = -(540 + charge * 460);
        ball.vx = -22 - Math.random() * 18;
        ball.inPlungerLane = false;
        launched = true;
      }
    }
    if (launched) {
      this.ballSaveTimer = 8.0;
      this.events.push({ type: 'sound', sound: 'SPRING1.WAV', panX: 467 });
    }
  }

  public nudge(dirX: number, dirY: number): void {
    if (this.paused || this.gameOver || this.tilted) return;
    this.tiltWarnings += 1;
    this.nudgeOffsetX = dirX * 5;
    this.nudgeOffsetY = dirY * 4;

    if (this.tiltWarnings >= 4) {
      this.tilted = true;
      for (const f of this.flippers) {
        f.pressed = false;
      }
      this.events.push({ type: 'sound', sound: 'OOPS1.WAV', panX: 246 });
      this.events.push({ type: 'banner', bannerKey: 'tiltPenalty' });
      return;
    }

    for (const ball of this.balls) {
      if (ball.active && !ball.inPlungerLane) {
        ball.vx += dirX * 95;
        ball.vy += dirY * 75;
      }
    }
    this.events.push({ type: 'sound', sound: 'KACHUNK1.WAV', panX: 246 });
    if (this.tiltWarnings === 3) {
      this.events.push({ type: 'banner', bannerKey: 'tiltWarning' });
    }
  }

  public step(dt: number): void {
    if (this.paused || this.gameOver) return;
    const clampedDt = Math.min(dt, 0.033);

    // Decay visual flash timers & table nudge offset
    this.nudgeOffsetX *= Math.pow(0.001, clampedDt);
    this.nudgeOffsetY *= Math.pow(0.001, clampedDt);
    if (this.ballSaveTimer > 0) {
      this.ballSaveTimer = Math.max(0, this.ballSaveTimer - clampedDt);
    }

    for (const [id, t] of this.bumperFlashTimers.entries()) {
      if (t <= clampedDt) {
        this.bumperFlashTimers.delete(id);
      } else {
        this.bumperFlashTimers.set(id, t - clampedDt);
      }
    }

    // Charge plunger spring
    if (this.plungerCharging) {
      this.plungerCharge = Math.min(1, this.plungerCharge + clampedDt * 1.15);
    }

    // Run 8 physics sub-steps per frame (480Hz effective rate)
    const subSteps = 8;
    const subDt = clampedDt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      this.stepFlippers(subDt);
      for (const ball of this.balls) {
        if (ball.active) {
          this.stepSingleBall(ball, subDt);
        }
      }
      this.resolveBallBallCollisions();
    }

    // Update ball trails once per render frame
    for (const ball of this.balls) {
      if (!ball.active) continue;
      ball.trail.unshift({ x: ball.x, y: ball.y, z: ball.z });
      if (ball.trail.length > 9) {
        ball.trail.pop();
      }
    }

    // Check drained balls
    const activeBalls = this.balls.filter((b) => b.active);
    if (activeBalls.length === 0) {
      this.handleAllBallsDrained();
    }
  }

  private stepFlippers(dt: number): void {
    const speedUp = 26.0;
    const speedDown = 16.0;
    for (const f of this.flippers) {
      const prevAngle = f.angleRad;
      const target = f.pressed && !this.tilted ? f.activeAngleRad : f.restAngleRad;
      const diff = target - f.angleRad;
      const rate = f.pressed ? speedUp : speedDown;
      const maxDelta = rate * dt;
      if (Math.abs(diff) <= maxDelta) {
        f.angleRad = target;
      } else {
        f.angleRad += Math.sign(diff) * maxDelta;
      }
      f.angularVelocity = (f.angleRad - prevAngle) / Math.max(dt, 1e-5);
    }
  }

  private stepSingleBall(ball: PinballBall, dt: number): void {
    const kernel = getWasmPhysicsKernel();

    // 1. Handle sinkhole capture & timed ejection
    if (ball.sinkholeId) {
      ball.sinkholeTimer -= dt;
      if (ball.sinkholeTimer <= 0) {
        const sink = this.table.sinkholes.find((s) => s.id === ball.sinkholeId);
        ball.sinkholeId = null;
        if (sink) {
          ball.vx = sink.ejectVx + (Math.random() - 0.5) * 35;
          ball.vy = sink.ejectVy;
          this.events.push({ type: 'sound', sound: 'KACHUNK2.WAV', panX: sink.x });
        }
      }
      return;
    }

    // 2. Handle overhead quadratic Bezier spline ramp (`PB_SPLIN`)
    if (ball.rampId) {
      const ramp = this.table.ramps.find((r) => r.id === ball.rampId);
      if (ramp) {
        ball.rampT += dt * 1.45;
        ball.z = Math.sin(Math.min(1, ball.rampT) * Math.PI) * 3.0;
        if (ball.rampT >= 1) {
          ball.x = ramp.exitX;
          ball.y = ramp.exitY;
          ball.vx = -40;
          ball.vy = 165;
          ball.z = 0;
          ball.rampId = null;
          ball.rampT = 0;
          this.events.push({ type: 'sound', sound: 'KACHUNK3.WAV', panX: ramp.exitX });
        } else {
          ball.x = kernel.quadBezier(ramp.entryX, ramp.controlX, ramp.exitX, ball.rampT);
          ball.y = kernel.quadBezier(ramp.entryY, ramp.controlY, ramp.exitY, ball.rampT);
        }
        return;
      }
      ball.rampId = null;
    }

    // 3. Apply playfield gravity and subtle aerodynamic damping
    ball.vy += this.table.gravity * dt;
    ball.vx *= 1 - 0.04 * dt;
    ball.vy *= 1 - 0.04 * dt;

    // Clamp max ball speed for collision stability
    const speed = kernel.distance2d(0, 0, ball.vx, ball.vy);
    const maxSpeed = 980;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      ball.vx *= scale;
      ball.vy *= scale;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Once the ball clears the top of the launch lane (x < 448), close the one-way gate
    if (ball.inPlungerLane && ball.x < 446 && ball.y < 145) {
      ball.inPlungerLane = false;
      this.events.push({ type: 'sound', sound: 'GATE1.WAV', panX: 446 });
    }

    // 4. Collide with static table walls (`PB_COL`)
    for (const wall of this.table.walls) {
      this.collideBallWithSegment(ball, wall.x1, wall.y1, wall.x2, wall.y2, wall.restitution ?? 0.6);
    }

    // One-way plunger gate at top of launch lane once ball is in playfield
    if (!ball.inPlungerLane) {
      this.collideBallWithSegment(ball, 452, 50, 452, 145, 0.55);
    }

    // 5. Collide with articulated flippers (`PB_FLIP`)
    for (const flipper of this.flippers) {
      this.collideBallWithFlipper(ball, flipper);
    }

    // 6. Collide with circular plasma bumpers
    for (const bumper of this.table.bumpers) {
      const dist = kernel.distance2d(ball.x, ball.y, bumper.x, bumper.y);
      const minDist = ball.radius + bumper.radius;
      if (dist < minDist && dist > 1e-5) {
        const nx = (ball.x - bumper.x) / dist;
        const ny = (ball.y - bumper.y) / dist;
        ball.x = bumper.x + nx * (minDist + 0.5);
        ball.y = bumper.y + ny * (minDist + 0.5);

        const vn = kernel.dot2d(ball.vx, ball.vy, nx, ny);
        if (vn < 0) {
          ball.vx -= 1.8 * vn * nx;
          ball.vy -= 1.8 * vn * ny;
        }
        ball.vx += nx * bumper.impulse;
        ball.vy += ny * bumper.impulse;

        if (!this.tilted) {
          this.addScore(bumper.points);
          this.bumperFlashTimers.set(bumper.id, 0.16);
          this.events.push({ type: 'sound', sound: bumper.sound, panX: bumper.x });
        }
      }
    }

    // 7. Check mission target banks
    if (!this.tilted) {
      for (const target of this.table.targets) {
        const dist = kernel.distance2d(ball.x, ball.y, target.x, target.y);
        if (dist < ball.radius + target.radius) {
          if (!this.litTargets.has(target.id)) {
            this.litTargets.add(target.id);
            this.addScore(target.points * 2);
            this.events.push({ type: 'sound', sound: 'SCORE3.WAV', panX: target.x });
            this.checkGroupCompletion(target.groupId);
          } else {
            this.addScore(Math.floor(target.points * 0.4));
          }
          // Gentle target rebound
          const nx = (ball.x - target.x) / Math.max(dist, 1);
          const ny = (ball.y - target.y) / Math.max(dist, 1);
          ball.vx += nx * 85;
          ball.vy += ny * 85;
        }
      }

      // 8. Check overhead ramp entries (`PB_SPLIN`)
      for (const ramp of this.table.ramps) {
        const dist = kernel.distance2d(ball.x, ball.y, ramp.entryX, ramp.entryY);
        if (dist < ramp.entryRadius && ball.vy < -160) {
          ball.rampId = ramp.id;
          ball.rampT = 0.02;
          this.addScore(ramp.points);
          this.events.push({ type: 'sound', sound: 'WHOOSH1.WAV', panX: ramp.entryX });
          this.events.push({ type: 'banner', bannerKey: 'rampShot' });
          return;
        }
      }

      // 9. Check sinkholes / command locks
      for (const sink of this.table.sinkholes) {
        const dist = kernel.distance2d(ball.x, ball.y, sink.x, sink.y);
        if (dist < sink.radius && speed < 540) {
          ball.x = sink.x;
          ball.y = sink.y;
          ball.vx = 0;
          ball.vy = 0;
          ball.sinkholeId = sink.id;
          ball.sinkholeTimer = 0.75;
          this.addScore(sink.points);
          this.events.push({ type: 'sound', sound: 'LOCK1.WAV', panX: sink.x });
          if (this.completedGroups.size >= 2) {
            this.spawnMultiball();
          }
          return;
        }
      }
    }

    // 10. Check drain at bottom of playfield
    if (ball.y > 476) {
      ball.active = false;
      this.events.push({ type: 'sound', sound: 'DRAIN1.WAV', panX: ball.x });
    }
  }

  private collideBallWithSegment(
    ball: PinballBall,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    restitution: number
  ): void {
    const proj = projectPointOntoSegment(ball.x, ball.y, x1, y1, x2, y2);
    if (proj.distance < ball.radius) {
      const overlap = ball.radius - proj.distance;
      ball.x += proj.normalX * overlap;
      ball.y += proj.normalY * overlap;

      const kernel = getWasmPhysicsKernel();
      const vn = kernel.dot2d(ball.vx, ball.vy, proj.normalX, proj.normalY);
      if (vn < 0) {
        ball.vx -= (1 + restitution) * vn * proj.normalX;
        ball.vy -= (1 + restitution) * vn * proj.normalY;

        if (restitution > 1.0 && !this.tilted) {
          this.addScore(500);
          this.events.push({ type: 'sound', sound: 'RUBBER1.WAV', panX: ball.x });
        }
      }
    }
  }

  private collideBallWithFlipper(ball: PinballBall, flipper: FlipperState): void {
    const tipX = flipper.pivotX + Math.cos(flipper.angleRad) * flipper.length;
    const tipY = flipper.pivotY + Math.sin(flipper.angleRad) * flipper.length;
    const proj = projectPointOntoSegment(ball.x, ball.y, flipper.pivotX, flipper.pivotY, tipX, tipY);
    const minDist = ball.radius + flipper.radius;

    if (proj.distance < minDist) {
      const overlap = minDist - proj.distance;
      ball.x += proj.normalX * (overlap + 0.4);
      ball.y += proj.normalY * (overlap + 0.4);

      // Tangential velocity of flipper at contact point (lever arm = t * length)
      const leverArm = proj.t * flipper.length;
      const surfVx = -Math.sin(flipper.angleRad) * flipper.angularVelocity * leverArm;
      const surfVy = Math.cos(flipper.angleRad) * flipper.angularVelocity * leverArm;

      const relVx = ball.vx - surfVx;
      const relVy = ball.vy - surfVy;

      const kernel = getWasmPhysicsKernel();
      const vn = kernel.dot2d(relVx, relVy, proj.normalX, proj.normalY);
      if (vn < 0) {
        const restitution = 0.72;
        ball.vx -= (1 + restitution) * vn * proj.normalX;
        ball.vy -= (1 + restitution) * vn * proj.normalY;
      }

      // Add strong upward impulse when flipper is actively swinging upward
      if (Math.abs(flipper.angularVelocity) > 0.5) {
        ball.vx += surfVx * 0.58 + proj.normalX * 165;
        ball.vy += surfVy * 0.58 - 220;
      }
    }
  }

  private resolveBallBallCollisions(): void {
    const active = this.balls.filter((b) => b.active && !b.sinkholeId && !b.rampId);
    if (active.length < 2) return;

    const kernel = getWasmPhysicsKernel();
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const b1 = active[i];
        const b2 = active[j];
        const dx = b1.x - b2.x;
        const dy = b1.y - b2.y;
        const dist = kernel.distance2d(0, 0, dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 1e-4) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Positional relaxation separation
          b1.x += nx * overlap * 0.5;
          b1.y += ny * overlap * 0.5;
          b2.x -= nx * overlap * 0.5;
          b2.y -= ny * overlap * 0.5;

          // Relative velocity along collision normal
          const dvx = b1.vx - b2.vx;
          const dvy = b1.vy - b2.vy;
          const vn = kernel.dot2d(dvx, dvy, nx, ny);

          if (vn < 0) {
            // Elastic collision between identical steel balls (e = 0.94)
            const restitution = 0.94;
            const impulse = -(1 + restitution) * vn * 0.5;
            b1.vx += impulse * nx;
            b1.vy += impulse * ny;
            b2.vx -= impulse * nx;
            b2.vy -= impulse * ny;

            this.events.push({
              type: 'sound',
              sound: 'KACHUNK1.WAV',
              panX: (b1.x + b2.x) * 0.5,
            });
          }
        }
      }
    }
  }

  private checkGroupCompletion(groupId: string): void {
    const groupTargets = this.table.targets.filter((t) => t.groupId === groupId);
    const allLit = groupTargets.every((t) => this.litTargets.has(t.id));
    if (allLit && !this.completedGroups.has(groupId)) {
      this.completedGroups.add(groupId);
      this.multiplier = Math.min(10, this.multiplier + 1);
      this.addScore(25000);
      this.events.push({ type: 'sound', sound: 'SCORE10.WAV', panX: 246 });

      // If all target groups on the table are completed, advance sector or Warp to next table!
      const totalGroups = new Set(this.table.targets.map((t) => t.groupId)).size;
      if (this.completedGroups.size >= totalGroups) {
        this.sectorLevel += 1;
        this.addScore(75000);
        this.events.push({ type: 'sound', sound: 'VICTORY1.WAV', panX: 246 });
        this.events.push({ type: 'banner', bannerKey: 'missionComplete' });

        // Advance to next table in sequence (Outpost -> Command Post -> Mine)
        const idx = TABLE_ORDER.indexOf(this.tableId);
        const nextIdx = (idx + 1) % TABLE_ORDER.length;
        const nextTableId = TABLE_ORDER[nextIdx];
        if (nextTableId !== this.tableId) {
          this.selectTable(nextTableId, false);
          this.events.push({ type: 'table_change', tableId: nextTableId });
        } else {
          this.litTargets.clear();
          this.completedGroups.clear();
        }
      }
    }
  }

  private handleAllBallsDrained(): void {
    if (this.ballSaveTimer > 0 && !this.tilted) {
      this.ballSaveTimer = 0;
      this.spawnBallInPlunger();
      this.events.push({ type: 'sound', sound: 'FANFARE1.WAV', panX: 246 });
      this.events.push({ type: 'banner', bannerKey: 'ballSaved' });
      return;
    }

    this.ballsRemaining -= 1;
    if (this.ballsRemaining > 0) {
      this.spawnBallInPlunger();
      this.events.push({ type: 'banner', bannerKey: 'shootAgain' });
    } else {
      this.gameOver = true;
      this.events.push({ type: 'sound', sound: 'LOSE1.WAV', panX: 246 });
      this.events.push({ type: 'game_over', bannerKey: 'gameOver' });
    }
  }

  public addScore(basePoints: number): void {
    this.score += Math.round(basePoints * this.multiplier);
  }
}
