// guards.js — one guard: patrol waypoints, suspicion, alarm, recovery.
import {
  GUARD_R,
  PATROL_SPEED,
  INVESTIGATE_SPEED,
  CHASE_SPEED,
  SUSPICIOUS_AT,
  ALARM_AT,
  ALARM_COOL_SECONDS,
  DETECT_DECAY_RATE,
  CATCH_DIST,
  ALERT_RADIUS,
} from './config.js';
import { playerVisible, detectionRate, pushCircleOutOfRect, pointInRect } from './vision.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  INVESTIGATE: 'investigate',
};

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.wpIndex = 0;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.facing = 0;
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.lastSeen = null; // {x, y} where the player was last spotted
    this.lostTimer = 0; // seconds without line of sight while chasing
    this.pauseTimer = 0; // seconds to stand still at a waypoint
    this.lookTimer = 0; // seconds spent looking around an investigate point
    this.stepTimer = 0; // footstep cadence
    this.moving = false;
    this.justSpotted = false; // set for one frame when suspicion crosses a line
    this.justAlarmed = false;
  }

  faceToward(x, y) {
    this.facing = Math.atan2(y - this.y, x - this.x);
  }

  // Move toward a point at speed, sliding along walls. Returns arrived.
  moveToward(tx, ty, speed, dt, walls) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return true;
    const step = Math.min(speed * dt, dist);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.moving = true;
    this.faceToward(tx, ty);
    // Axis-separated so the guard slides along a wall instead of sticking.
    let px = nx;
    let py = this.y;
    for (const w of walls) {
      const fixed = pushCircleOutOfRect(px, py, GUARD_R, w);
      px = fixed.x;
      py = fixed.y;
    }
    let qx = px;
    let qy = ny;
    for (const w of walls) {
      const fixed = pushCircleOutOfRect(qx, qy, GUARD_R, w);
      qx = fixed.x;
      qy = fixed.y;
    }
    this.x = qx;
    this.y = qy;
    return Math.hypot(tx - this.x, ty - this.y) < 6;
  }

  hearNoise(nx, ny, radius) {
    if (this.state === GUARD_STATE.CHASE) return;
    if (Math.hypot(nx - this.x, ny - this.y) > radius) return;
    if (this.state === GUARD_STATE.PATROL) {
      this.state = GUARD_STATE.SUSPICIOUS;
      this.lastSeen = { x: nx, y: ny };
      this.justSpotted = true;
    }
  }

  raiseAlarm(world) {
    this.state = GUARD_STATE.CHASE;
    this.justAlarmed = true;
    this.lostTimer = 0;
    // Nearby guards join the hunt at the same last-seen point.
    for (const other of world.guards) {
      if (other === this) continue;
      if (Math.hypot(other.x - this.x, other.y - this.y) <= ALERT_RADIUS) {
        if (other.state !== GUARD_STATE.CHASE) {
          other.state = GUARD_STATE.CHASE;
          other.lastSeen = this.lastSeen ? { ...this.lastSeen } : null;
          other.suspicion = Math.max(other.suspicion, 60);
          other.lostTimer = 0;
        }
      }
    }
  }

  update(dt, world) {
    const player = world.player;
    this.justSpotted = false;
    this.justAlarmed = false;
    this.moving = false;

    // --- Detection: fill the meter while the player is seen, drain it unseen.
    const seen = playerVisible(this, player, world.walls);
    if (seen) {
      const before = this.suspicion;
      this.suspicion = Math.min(ALARM_AT, this.suspicion + detectionRate(this, player, world.lamps) * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.lostTimer = 0;
      if (before < SUSPICIOUS_AT && this.suspicion >= SUSPICIOUS_AT) this.justSpotted = true;
      if (this.suspicion >= ALARM_AT && this.state !== GUARD_STATE.CHASE) {
        this.raiseAlarm(world);
      } else if (this.suspicion >= SUSPICIOUS_AT && this.state === GUARD_STATE.PATROL) {
        this.state = GUARD_STATE.SUSPICIOUS;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - DETECT_DECAY_RATE * dt);
      if (this.state === GUARD_STATE.CHASE) {
        this.lostTimer += dt;
        if (this.lostTimer >= ALARM_COOL_SECONDS) {
          this.state = GUARD_STATE.SUSPICIOUS;
          this.lostTimer = 0;
        }
      }
    }

    // --- Behaviour by state.
    if (this.state === GUARD_STATE.PATROL) {
      if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        // Scan the room while waiting at a waypoint.
        this.facing += dt * 0.9;
      } else {
        const wp = this.waypoints[this.wpIndex];
        if (this.moveToward(wp.x, wp.y, PATROL_SPEED, dt, world.walls)) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.pauseTimer = 0.8;
        }
      }
    } else if (this.state === GUARD_STATE.SUSPICIOUS || this.state === GUARD_STATE.INVESTIGATE) {
      const target = this.lastSeen;
      if (target && this.moveToward(target.x, target.y, INVESTIGATE_SPEED, dt, world.walls)) {
        this.lookTimer += dt;
        this.facing += dt * 1.6; // look around the spot
        if (this.lookTimer > 1.6) {
          this.lookTimer = 0;
          this.state = GUARD_STATE.PATROL;
          this.suspicion = Math.max(0, this.suspicion - 20);
        }
      }
    } else if (this.state === GUARD_STATE.CHASE) {
      if (this.lastSeen) {
        this.moveToward(player.x, player.y, CHASE_SPEED, dt, world.walls);
      }
    }

    // --- Footsteps: the sound bank paces them by distance and direction.
    if (this.moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.45;
        world.onGuardStep(this);
      }
    }

    // --- Caught: an alarmed guard touches the player.
    if (this.state === GUARD_STATE.CHASE) {
      if (Math.hypot(player.x - this.x, player.y - this.y) <= CATCH_DIST + 2) {
        world.onCaught(this);
      }
    }
  }

  // Snapshot for the driver and the HUD.
  snapshot() {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
      state: this.state,
      suspicion: Math.round(this.suspicion),
    };
  }
}

// A guard counts as "in cover" for no purpose — only the player hides.
// This helper keeps the renderer's cover test in one place.
export function guardInCover(guard, cover) {
  for (const c of cover) {
    if (pointInRect(guard.x, guard.y, c)) return true;
  }
  return false;
}
