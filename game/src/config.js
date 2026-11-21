// config.js — every tuning number for MOTH, in one place.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 46;

// Play area is the canvas below the HUD strip.
export const PLAY_TOP = HUD_H;
export const PLAY_LEFT = 0;
export const PLAY_RIGHT = VIEW_W;
export const PLAY_BOTTOM = VIEW_H;

export const PLAYER_R = 11;
export const GUARD_R = 12;

export const WALK_SPEED = 165; // px/s, upright
export const SNEAK_SPEED = 85; // px/s, holding Shift

export const PATROL_SPEED = 70;
export const INVESTIGATE_SPEED = 100;
export const CHASE_SPEED = 135;

export const VISION_RANGE = 200;
export const VISION_HALF_ANGLE = (34 * Math.PI) / 180;

export const DETECT_BASE_RATE = 55; // suspicion per second at point blank
export const DETECT_DECAY_RATE = 30; // suspicion per second while unseen
export const SUSPICIOUS_AT = 35; // "?" — guard investigates
export const ALARM_AT = 100; // "!" — guard chases
export const ALARM_COOL_SECONDS = 3.5; // LOS lost this long before the alarm cools

export const NOISE_WALK_RADIUS = 90;
export const NOISE_SNEAK_RADIUS = 25;

export const CATCH_DIST = 16;
export const ALERT_RADIUS = 260; // nearby guards join an alarm

export const RELIC_SCORE = 100;
export const LEVEL_BONUS_BASE = 500;
export const LEVEL_BONUS_PER_SECOND = 2;
export const LEVEL_BONUS_MIN = 100;

export const COLORS = {
  floor: '#232a3a',
  floorTile: '#283045',
  floorEdge: '#1a2030',
  wall: '#3d4b63',
  wallTop: '#5a6b8c',
  coverBush: '#2f6b3a',
  coverBushDark: '#245430',
  coverCrate: '#7a5a33',
  coverCrateDark: '#5f4526',
  lampWarm: 'rgba(255, 196, 110, 0.20)',
  lampCore: 'rgba(255, 210, 130, 0.30)',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 60, 0.30)',
  coneAlarm: 'rgba(255, 60, 60, 0.34)',
  guardBody: '#c94f4f',
  guardDark: '#8e2f2f',
  guardEye: '#ffe9a8',
  playerCloak: '#7a5fd0',
  playerHood: '#4a3585',
  relic: '#ffd94d',
  relicGlow: 'rgba(255, 217, 77, 0.35)',
  exit: '#3fae6a',
  exitDark: '#2a7d4b',
  hudBg: '#141824',
  hudText: '#e8ecf5',
  hudMuted: '#9aa5bd',
  danger: '#ff5a5a',
  warn: '#ffb347',
};
