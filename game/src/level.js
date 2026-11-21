// level.js — three hand-built floors of the Meridian Archive.
// Every wall is an axis-aligned rect; cover is bush or crate; lamps are warm
// pools of light; guards patrol named waypoint loops; relics glow gold.
import { PLAY_TOP } from './config.js';

function wall(x, y, w, h) {
  return { x, y, w, h };
}
function cover(kind, x, y, w, h) {
  return { kind, x, y, w, h };
}
function lamp(x, y, r = 110) {
  return { x, y, r };
}
function guardPatrol(waypoints) {
  return { waypoints };
}
function relic(name, x, y) {
  return { name, x, y, taken: false };
}

export const LEVELS = [
  {
    name: 'Level 1 — The Gallery',
    intro: 'One relic: the Sun Disk. Slip past the gallery guards and leave by the green door.',
    playerStart: { x: 90, y: 660 },
    exit: { x: 1190, y: 640, w: 70, h: 60 },
    walls: [
      wall(300, 200, 20, 300),
      wall(300, 200, 260, 20),
      wall(700, 420, 20, 200),
      wall(700, 420, 280, 20),
      wall(950, 150, 20, 180),
      wall(150, 520, 200, 20),
    ],
    cover: [
      cover('bush', 420, 300, 90, 60),
      cover('bush', 820, 180, 90, 60),
      cover('crate', 520, 560, 80, 60),
      cover('crate', 1050, 480, 90, 60),
    ],
    lamps: [lamp(400, 150), lamp(900, 300), lamp(650, 600)],
    guards: [
      guardPatrol([
        { x: 500, y: 150 },
        { x: 900, y: 150 },
      ]),
      guardPatrol([
        { x: 110, y: 300 },
        { x: 110, y: 600 },
      ]),
    ],
    relics: [relic('Sun Disk', 1180, 130)],
  },
  {
    name: 'Level 2 — The Archive',
    intro: 'Two relics among the stacks. The archivists walk longer beats — watch, wait, then move.',
    playerStart: { x: 90, y: 660 },
    exit: { x: 1190, y: 640, w: 70, h: 60 },
    walls: [
      wall(250, 180, 20, 260),
      wall(250, 180, 300, 20),
      wall(600, 480, 20, 190),
      wall(600, 480, 320, 20),
      wall(1000, 120, 20, 220),
      wall(150, 560, 260, 20),
      wall(850, 300, 180, 20),
    ],
    cover: [
      cover('bush', 380, 320, 90, 60),
      cover('bush', 700, 150, 90, 60),
      cover('bush', 480, 600, 90, 60),
      cover('bush', 1080, 420, 90, 60),
      cover('crate', 950, 580, 80, 60),
    ],
    lamps: [lamp(350, 120), lamp(750, 250), lamp(1100, 550), lamp(550, 500)],
    guards: [
      guardPatrol([
        { x: 400, y: 120 },
        { x: 950, y: 120 },
      ]),
      guardPatrol([
        { x: 120, y: 300 },
        { x: 120, y: 600 },
      ]),
      guardPatrol([
        { x: 700, y: 650 },
        { x: 1100, y: 650 },
      ]),
    ],
    relics: [relic('Moon Ledger', 1150, 120), relic('Ivory Quill', 180, 180)],
  },
  {
    name: 'Level 3 — The Vault',
    intro: 'Three relics, four vault wardens, and very little shadow. This is the clean getaway.',
    playerStart: { x: 90, y: 660 },
    exit: { x: 1190, y: 640, w: 70, h: 60 },
    walls: [
      wall(220, 160, 20, 280),
      wall(220, 160, 280, 20),
      wall(560, 420, 20, 250),
      wall(560, 420, 300, 20),
      wall(980, 120, 20, 240),
      wall(980, 360, 20, 200),
      wall(120, 540, 300, 20),
      wall(820, 560, 300, 20),
    ],
    cover: [
      cover('bush', 340, 300, 90, 60),
      cover('bush', 680, 180, 90, 60),
      cover('bush', 420, 620, 90, 60),
      cover('bush', 1060, 480, 90, 60),
      cover('crate', 700, 300, 80, 60),
      cover('crate', 150, 300, 80, 60),
    ],
    lamps: [lamp(300, 120), lamp(700, 250), lamp(1150, 300), lamp(500, 600), lamp(950, 600)],
    guards: [
      guardPatrol([
        { x: 350, y: 120 },
        { x: 900, y: 120 },
      ]),
      guardPatrol([
        { x: 95, y: 300 },
        { x: 95, y: 600 },
      ]),
      guardPatrol([
        { x: 650, y: 650 },
        { x: 1150, y: 650 },
      ]),
      guardPatrol([
        { x: 1150, y: 200 },
        { x: 1150, y: 520 },
      ]),
    ],
    relics: [
      relic('Crown of Tides', 1180, 120),
      relic('Jade Scarab', 150, 150),
      relic('Ember Opal', 640, 640),
    ],
  },
];

// The play-area border is a wall too, drawn and enforced by the game.
export function borderWalls() {
  return [
    wall(0, PLAY_TOP, 1280, 8),
    wall(0, 712, 1280, 8),
    wall(0, PLAY_TOP, 8, 720 - PLAY_TOP),
    wall(1272, PLAY_TOP, 8, 720 - PLAY_TOP),
  ];
}
