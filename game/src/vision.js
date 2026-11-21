// vision.js — cones, line of sight, light and shadow, detection rates.
import {
  VISION_RANGE,
  VISION_HALF_ANGLE,
  DETECT_BASE_RATE,
} from './config.js';

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Circle-vs-rect push-out: returns the corrected centre for a circle of
// radius r at (x, y) that must not overlap rect r.
export function pushCircleOutOfRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x, y, hit: false };
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    return { x: cx + (dx / d) * r, y: cy + (dy / d) * r, hit: true };
  }
  // Centre inside the rect: push out along the smallest penetration axis.
  const left = x - rect.x;
  const right = rect.x + rect.w - x;
  const top = y - rect.y;
  const bottom = rect.y + rect.h - y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return { x: rect.x - r, y, hit: true };
  if (m === right) return { x: rect.x + rect.w + r, y, hit: true };
  if (m === top) return { x, y: rect.y - r, hit: true };
  return { x, y: rect.y + rect.h + r, hit: true };
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Liang–Barsky clipping: true when the segment crosses the rect.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// True when no wall stands between the two points.
export function lineOfSightClear(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

// How far a ray from (x, y) along angle travels before a wall or maxDist.
export function rayDistance(x, y, angle, maxDist, walls) {
  const step = 6;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const px = x + dx * d;
    const py = y + dy * d;
    for (const w of walls) {
      if (pointInRect(px, py, w)) return d;
    }
  }
  return maxDist;
}

// The guard's vision cone as a polygon, raycast so walls cut it short.
export function conePolygon(guard, walls, rays = 26) {
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rays; i += 1) {
    const a = guard.facing - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / rays;
    const d = rayDistance(guard.x, guard.y, a, VISION_RANGE, walls);
    pts.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return pts;
}

// Is the player inside this guard's cone with a clear line of sight?
export function playerVisible(guard, player, walls) {
  if (player.hidden) return false;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE) return false;
  const angleTo = Math.atan2(dy, dx);
  let diff = angleTo - guard.facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > VISION_HALF_ANGLE) return false;
  return lineOfSightClear(guard.x, guard.y, player.x, player.y, walls);
}

// True when the point sits inside any lamp's warm pool.
export function isLit(x, y, lamps) {
  for (const lamp of lamps) {
    if (Math.hypot(x - lamp.x, y - lamp.y) <= lamp.r) return true;
  }
  return false;
}

// Suspicion gained per second while this guard can see the player.
export function detectionRate(guard, player, lamps) {
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
  const closeness = Math.max(0.15, 1 - dist / VISION_RANGE);
  let rate = DETECT_BASE_RATE * closeness;
  rate *= isLit(player.x, player.y, lamps) ? 2 : 0.45;
  if (player.sneaking) rate *= 0.6;
  return rate;
}
