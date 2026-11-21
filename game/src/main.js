// main.js — the loop and the state machine: title, playing, level-clear,
// caught, game-clear, pause. Wires input, player, guards, audio and render.
import {
  VIEW_W,
  VIEW_H,
  RELIC_SCORE,
  LEVEL_BONUS_BASE,
  LEVEL_BONUS_PER_SECOND,
  LEVEL_BONUS_MIN,
} from './config.js';
import { LEVELS, borderWalls } from './level.js';
import { Guard, GUARD_STATE } from './guards.js';
import { Player } from './player.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { makeRng } from './random.js';
import { isLit } from './vision.js';
import {
  drawFloor,
  drawWalls,
  drawCover,
  drawExit,
  drawRelics,
  drawGuards,
  drawPlayer,
  drawHud,
  drawAlarmVignette,
  drawHint,
  drawTitleScreen,
  drawLevelClearScreen,
  drawCaughtScreen,
  drawGameClearScreen,
  drawPaused,
} from './render.js';
import { parseShot, stageShot } from './shots.js';

const SCREENS = {
  TITLE: 'title',
  PLAYING: 'playing',
  LEVEL_CLEAR: 'levelclear',
  CAUGHT: 'caught',
  GAME_CLEAR: 'gameclear',
};

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.audio = new SoundBank();
    this.input.onFirstGesture = () => this.audio.ensure();
    this.screen = SCREENS.TITLE;
    this.paused = false;
    this.levelIndex = 0;
    this.level = null;
    this.walls = [];
    this.guards = [];
    this.player = null;
    this.relics = [];
    this.score = 0;
    this.levelStartScore = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.levelBonus = 0;
    this.hint = '';
    this.hintTimer = 0;
    this.time = 0;
    this.frozenTime = null;
    this.buttons = [];
    this.lastFrame = performance.now();

    const { shot, seed } = parseShot(window.location.search);
    this.seed = seed;
    this.shot = shot;
    if (shot) {
      stageShot(this, shot);
      this.render();
      return;
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  startLevel(index, opts = {}) {
    this.levelIndex = index;
    const def = LEVELS[index];
    // A fresh deep copy: relics must reset between retries and levels.
    this.level = {
      name: def.name,
      intro: def.intro,
      exit: { ...def.exit },
      lamps: def.lamps.map((l) => ({ ...l })),
      cover: def.cover.map((c) => ({ ...c })),
      relics: def.relics.map((r) => ({ ...r, taken: false })),
    };
    this.walls = [...def.walls.map((w) => ({ ...w })), ...borderWalls()];
    this.guards = def.guards.map((g) => new Guard(g));
    this.player = new Player(def.playerStart);
    this.relics = this.level.relics;
    this.levelTime = 0;
    this.hint = opts.skipIntro ? '' : def.intro;
    this.hintTimer = opts.skipIntro ? 0 : 5;
    this.levelStartScore = this.score;
    // Deterministic per-level offsets from the seeded RNG.
    const rng = makeRng(this.seed * 1000 + index + 7);
    for (const guard of this.guards) guard.stepTimer = rng.range(0, 0.45);
    this.screen = SCREENS.PLAYING;
  }

  // --- World callbacks the player and guards call into. ---

  onPlayerStep() {
    this.audio.playerStep(this.player.sneaking);
  }

  onGuardStep(guard) {
    this.audio.guardStep(guard.x - this.player.x, guard.y - this.player.y);
  }

  onRelicTaken(relic) {
    this.score += RELIC_SCORE;
    this.audio.pickupChime();
    const got = this.relics.filter((r) => r.taken).length;
    this.hint = `${relic.name} pocketed — ${got}/${this.relics.length} relics.`;
    this.hintTimer = 3;
  }

  onCaught() {
    if (this.screen !== SCREENS.PLAYING) return;
    this.screen = SCREENS.CAUGHT;
    this.audio.caughtSting();
  }

  update(dt) {
    if (this.screen !== SCREENS.PLAYING || this.paused) return;
    this.levelTime += dt;
    this.totalTime += dt;
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.hint = '';
    }

    const world = {
      player: this.player,
      walls: this.walls,
      lamps: this.level.lamps,
      cover: this.level.cover,
      relics: this.relics,
      guards: this.guards,
      onPlayerStep: () => this.onPlayerStep(),
      onGuardStep: (g) => this.onGuardStep(g),
      onRelicTaken: (r) => this.onRelicTaken(r),
      onCaught: () => this.onCaught(),
    };

    this.player.update(dt, this.input, world);

    // Footsteps carry: a walking player draws nearby guards toward the noise.
    const noise = this.player.noiseRadius();
    if (noise > 0) {
      for (const guard of this.guards) guard.hearNoise(this.player.x, this.player.y, noise);
    }

    for (const guard of this.guards) {
      guard.update(dt, world);
      if (guard.justSpotted) this.audio.suspiciousBlip();
      if (guard.justAlarmed) this.audio.alertSting();
      if (this.screen !== SCREENS.PLAYING) break;
    }
    if (this.screen !== SCREENS.PLAYING) return;

    // Exit: all relics in hand opens the door; otherwise a nudge.
    if (this.player.atExit(this.level.exit)) {
      const got = this.relics.filter((r) => r.taken).length;
      if (got === this.relics.length) {
        this.levelBonus = Math.max(
          LEVEL_BONUS_MIN,
          LEVEL_BONUS_BASE - LEVEL_BONUS_PER_SECOND * Math.floor(this.levelTime),
        );
        this.score += this.levelBonus;
        this.audio.fanfare();
        if (this.levelIndex + 1 < LEVELS.length) {
          this.screen = SCREENS.LEVEL_CLEAR;
        } else {
          this.screen = SCREENS.GAME_CLEAR;
          this.audio.winJingle();
        }
      } else if (this.hintTimer <= 0) {
        this.hint = 'The relic first! The door stays shut until every relic is pocketed.';
        this.hintTimer = 2.5;
      }
    }
  }

  handleScreenInput() {
    const input = this.input;
    const clicked = input.clickedButton(this.buttons);
    if (this.screen === SCREENS.TITLE) {
      if (input.wasPressed('Enter') || (clicked && clicked.id === 'start')) {
        this.score = 0;
        this.totalTime = 0;
        this.startLevel(0);
      }
    } else if (this.screen === SCREENS.LEVEL_CLEAR) {
      if (input.wasPressed('KeyN') || input.wasPressed('Enter') || (clicked && clicked.id === 'next')) {
        this.startLevel(this.levelIndex + 1);
      }
    } else if (this.screen === SCREENS.CAUGHT) {
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || (clicked && clicked.id === 'retry')) {
        this.score = this.levelStartScore;
        this.startLevel(this.levelIndex);
      }
    } else if (this.screen === SCREENS.GAME_CLEAR) {
      if (input.wasPressed('Enter') || (clicked && clicked.id === 'again')) {
        this.score = 0;
        this.totalTime = 0;
        this.startLevel(0);
      }
    }
    if (this.screen === SCREENS.PLAYING) {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
        this.paused = !this.paused;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const t = this.frozenTime !== null ? this.frozenTime : this.time;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (this.screen === SCREENS.TITLE) {
      drawFloor(ctx, LEVELS[0], t);
      this.buttons = drawTitleScreen(ctx, [
        { id: 'start', label: '▶  Start the night  (Enter)', x: 500, y: 505, w: 280, h: 40, accent: true },
      ]);
      return;
    }
    // World under every in-game screen.
    drawFloor(ctx, this.level, t);
    drawCover(ctx, this.level.cover, t);
    drawExit(ctx, this.level.exit, this.relics.every((r) => r.taken), t);
    drawRelics(ctx, this.relics, t);
    drawGuards(ctx, this.guards, this.walls);
    drawPlayer(ctx, this.player, t);
    drawWalls(ctx, this.walls);
    const maxSuspicion = Math.max(0, ...this.guards.map((g) => g.suspicion));
    drawHud(ctx, {
      levelName: this.level.name,
      relicsGot: this.relics.filter((r) => r.taken).length,
      relicsTotal: this.relics.length,
      score: this.score,
      timeText: formatTime(this.levelTime),
      maxSuspicion: Math.round(maxSuspicion),
      playerHidden: this.player.hidden,
      playerLit: isLit(this.player.x, this.player.y, this.level.lamps),
    });
    drawAlarmVignette(
      ctx,
      maxSuspicion,
      t,
      this.guards.some((g) => g.state === GUARD_STATE.CHASE),
    );
    drawHint(ctx, this.hint);
    if (this.screen === SCREENS.LEVEL_CLEAR) {
      this.buttons = drawLevelClearScreen(ctx, this.level.name, this.levelBonus, this.score, [
        { id: 'next', label: 'Next floor  (N)', x: 540, y: 505, w: 200, h: 40, accent: true },
      ]);
    } else if (this.screen === SCREENS.CAUGHT) {
      this.buttons = drawCaughtScreen(ctx, [
        { id: 'retry', label: 'Retry  (R)', x: 540, y: 505, w: 200, h: 40, accent: true },
      ]);
    } else if (this.screen === SCREENS.GAME_CLEAR) {
      this.buttons = drawGameClearScreen(ctx, this.score, formatTime(this.totalTime), [
        { id: 'again', label: 'Play again  (Enter)', x: 500, y: 505, w: 280, h: 40, accent: true },
      ]);
    } else if (this.paused) {
      drawPaused(ctx);
    }
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.time += dt;
    this.handleScreenInput();
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  // Driver probe: the play-test reads this, never the DOM.
  state() {
    return {
      screen: this.screen,
      level: this.levelIndex + 1,
      levelName: this.level ? this.level.name : null,
      player: this.player ? this.player.snapshot() : null,
      guards: this.guards.map((g) => g.snapshot()),
      relicsGot: this.relics.filter((r) => r.taken).length,
      relicsTotal: this.relics.length,
      score: this.score,
      levelTime: Math.round(this.levelTime * 10) / 10,
      caught: this.screen === SCREENS.CAUGHT,
      won: this.screen === SCREENS.GAME_CLEAR,
      paused: this.paused,
    };
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__stealth = { state: () => game.state() };
