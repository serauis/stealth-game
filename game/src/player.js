// player.js — Moth, the burglar: movement, sneak, noise, hiding, loot, exit.
import {
  PLAYER_R,
  WALK_SPEED,
  SNEAK_SPEED,
  NOISE_WALK_RADIUS,
  NOISE_SNEAK_RADIUS,
  PLAY_TOP,
  PLAY_LEFT,
  PLAY_RIGHT,
  PLAY_BOTTOM,
} from './config.js';
import { pushCircleOutOfRect, pointInRect } from './vision.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.sneaking = false;
    this.hidden = false;
    this.moving = false;
    this.stepTimer = 0;
    this.facing = -Math.PI / 2; // starts facing up the room
  }

  noiseRadius() {
    if (!this.moving) return 0;
    return this.sneaking ? NOISE_SNEAK_RADIUS : NOISE_WALK_RADIUS;
  }

  update(dt, input, world) {
    let dx = 0;
    let dy = 0;
    if (input.down('KeyW') || input.down('ArrowUp')) dy -= 1;
    if (input.down('KeyS') || input.down('ArrowDown')) dy += 1;
    if (input.down('KeyA') || input.down('ArrowLeft')) dx -= 1;
    if (input.down('KeyD') || input.down('ArrowRight')) dx += 1;
    this.sneaking = input.down('ShiftLeft') || input.down('ShiftRight');
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.facing = Math.atan2(dy, dx);
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      const nx = this.x + dx * speed * dt;
      const ny = this.y + dy * speed * dt;
      // Axis-separated so Moth slides along walls instead of sticking.
      let px = nx;
      let py = this.y;
      for (const w of world.walls) {
        const fixed = pushCircleOutOfRect(px, py, PLAYER_R, w);
        px = fixed.x;
        py = fixed.y;
      }
      let qx = px;
      let qy = ny;
      for (const w of world.walls) {
        const fixed = pushCircleOutOfRect(qx, qy, PLAYER_R, w);
        qx = fixed.x;
        qy = fixed.y;
      }
      this.x = Math.max(PLAY_LEFT + PLAYER_R, Math.min(PLAY_RIGHT - PLAYER_R, qx));
      this.y = Math.max(PLAY_TOP + PLAYER_R, Math.min(PLAY_BOTTOM - PLAYER_R, qy));

      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.45 : 0.32;
        world.onPlayerStep(this);
      }
    }

    // Hidden when the player's centre is inside a bush or crate.
    this.hidden = false;
    for (const c of world.cover) {
      if (pointInRect(this.x, this.y, c)) {
        this.hidden = true;
        break;
      }
    }

    // Relics: walk over one to pocket it.
    for (const relic of world.relics) {
      if (!relic.taken && Math.hypot(relic.x - this.x, relic.y - this.y) < 26) {
        relic.taken = true;
        world.onRelicTaken(relic);
      }
    }
  }

  // True when standing in the green exit doorway.
  atExit(exit) {
    return pointInRect(this.x, this.y, exit);
  }

  snapshot() {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
      hidden: this.hidden,
      sneaking: this.sneaking,
    };
  }
}
