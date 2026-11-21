// render.js — draws the floor, light, walls, cover, cones, entities, HUD
// and every screen, all on one 2D canvas. Warm lamp pools read as safe,
// shadow reads as danger: the lighting is the stealth language.
import { VIEW_W, VIEW_H, HUD_H, COLORS, GUARD_R, PLAYER_R } from './config.js';
import { conePolygon, isLit } from './vision.js';
import { GUARD_STATE } from './guards.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawFloor(ctx, level, time) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  // Subtle tile grid so motion reads at a glance.
  ctx.strokeStyle = COLORS.floorTile;
  ctx.lineWidth = 1;
  const step = 64;
  ctx.beginPath();
  for (let x = step; x < VIEW_W; x += step) {
    ctx.moveTo(x, HUD_H);
    ctx.lineTo(x, VIEW_H);
  }
  for (let y = HUD_H + step; y < VIEW_H; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
  }
  ctx.stroke();
  // Warm lamp pools on the floor.
  for (const lamp of level.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, COLORS.lampCore);
    g.addColorStop(0.7, COLORS.lampWarm);
    g.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    // The lamp fitting itself.
    ctx.fillStyle = '#ffd28a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  void time;
}

export function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 5);
    ctx.strokeStyle = COLORS.floorEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

export function drawCover(ctx, cover, time) {
  for (const c of cover) {
    if (c.kind === 'bush') {
      ctx.fillStyle = COLORS.coverBushDark;
      roundRect(ctx, c.x, c.y, c.w, c.h, 14);
      ctx.fill();
      ctx.fillStyle = COLORS.coverBush;
      for (let i = 0; i < 5; i += 1) {
        const bx = c.x + 12 + ((i * 17 + 9) % (c.w - 20));
        const by = c.y + 12 + ((i * 23 + 7) % (c.h - 22));
        ctx.beginPath();
        ctx.arc(bx, by, 13 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = COLORS.coverCrate;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = COLORS.coverCrateDark;
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    }
  }
  void time;
}

export function drawExit(ctx, exit, allRelicsTaken, time) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 3);
  ctx.fillStyle = allRelicsTaken ? COLORS.exit : COLORS.exitDark;
  ctx.globalAlpha = allRelicsTaken ? pulse : 0.85;
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d8ffe6';
  ctx.lineWidth = 2;
  roundRect(ctx, exit.x + 3, exit.y + 3, exit.w - 6, exit.h - 6, 6);
  ctx.stroke();
  ctx.fillStyle = '#eafff1';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 - 8);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('→', exit.x + exit.w / 2, exit.y + exit.h / 2 + 12);
  void time;
}

export function drawRelics(ctx, relics, time) {
  for (const relic of relics) {
    if (relic.taken) continue;
    const glow = 26 + 6 * Math.sin(time * 4 + relic.x);
    const g = ctx.createRadialGradient(relic.x, relic.y, 2, relic.x, relic.y, glow);
    g.addColorStop(0, COLORS.relicGlow);
    g.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, glow, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.relic;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87f00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(relic.x - 3, relic.y - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(relic.name.toUpperCase(), relic.x, relic.y + 15);
  }
}

function coneColor(guard) {
  if (guard.state === GUARD_STATE.CHASE) return COLORS.coneAlarm;
  if (guard.state === GUARD_STATE.SUSPICIOUS || guard.state === GUARD_STATE.INVESTIGATE) {
    return COLORS.coneSuspicious;
  }
  return COLORS.coneCalm;
}

export function drawGuards(ctx, guards, walls) {
  for (const guard of guards) {
    // Vision cone, raycast so walls cut it short.
    const poly = conePolygon(guard, walls);
    ctx.fillStyle = coneColor(guard);
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    // Body: a warden in a red coat, facing where he looks.
    ctx.fillStyle = COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.guardDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.guardEye;
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.facing) * 6, guard.y + Math.sin(guard.facing) * 6, 3, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion: "?" while curious, "!" while hunting.
    if (guard.state === GUARD_STATE.CHASE) {
      ctx.fillStyle = '#ff2d2d';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('!', guard.x, guard.y - GUARD_R - 4);
    } else if (guard.suspicion >= 20) {
      ctx.fillStyle = COLORS.warn;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('?', guard.x, guard.y - GUARD_R - 4);
    }
    // Detection meter arc over the guard's head.
    if (guard.suspicion > 1) {
      const frac = guard.suspicion / 100;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD_R + 7, -Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();
      ctx.strokeStyle = frac >= 1 ? '#ff2d2d' : frac >= 0.35 ? COLORS.warn : '#ffd65a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD_R + 7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 10) * 1.5 : 0;
  ctx.save();
  if (player.hidden) ctx.globalAlpha = 0.45;
  // Hooded cloak: a violet teardrop pointing where Moth faces.
  ctx.translate(player.x, player.y + bob * 0.4);
  ctx.rotate(player.facing + Math.PI / 2);
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_R - 2);
  ctx.quadraticCurveTo(PLAYER_R + 2, 2, PLAYER_R - 2, PLAYER_R);
  ctx.quadraticCurveTo(0, PLAYER_R + 4, -PLAYER_R + 2, PLAYER_R);
  ctx.quadraticCurveTo(-PLAYER_R - 2, 2, 0, -PLAYER_R - 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath();
  ctx.arc(0, -3, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(0, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.hidden) {
    ctx.fillStyle = '#bfe9c9';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('HIDDEN', player.x, player.y - PLAYER_R - 6);
  }
  void time;
}

export function drawHud(ctx, hud) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MOTH — Night at the Meridian Archive', 16, HUD_H / 2 - 8);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.fillText(hud.levelName, 16, HUD_H / 2 + 11);
  // Relics, score, timer, centre-right.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`◆ ${hud.relicsGot}/${hud.relicsTotal} relics`, 560, HUD_H / 2);
  ctx.fillText(`Score ${hud.score}`, 720, HUD_H / 2);
  ctx.fillText(`⏱ ${hud.timeText}`, 850, HUD_H / 2);
  // Detection: the hottest guard's meter, right side.
  const hottest = hud.maxSuspicion;
  const barX = 920;
  const barW = 150;
  ctx.fillStyle = '#2a3042';
  roundRect(ctx, barX, HUD_H / 2 - 9, barW, 18, 9);
  ctx.fill();
  const frac = hottest / 100;
  ctx.fillStyle = frac >= 1 ? COLORS.danger : frac >= 0.35 ? COLORS.warn : '#ffd65a';
  if (frac > 0.01) {
    roundRect(ctx, barX, HUD_H / 2 - 9, Math.max(10, barW * frac), 18, 9);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(hottest >= 100 ? 'SPOTTED!' : hottest >= 35 ? 'SUSPICIOUS' : 'UNSEEN', barX + barW + 8, HUD_H / 2);
  // Light state of the player, far right.
  ctx.fillStyle = hud.playerLit ? COLORS.warn : '#9fe8b0';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(hud.playerHidden ? 'HIDDEN' : hud.playerLit ? 'IN LIGHT' : 'IN SHADOW', VIEW_W - 16, HUD_H / 2);
  ctx.textAlign = 'left';
}

export function drawHint(ctx, text) {
  if (!text) return;
  ctx.fillStyle = 'rgba(20, 24, 36, 0.88)';
  const w = ctx.measureText(text).width + 36;
  roundRect(ctx, VIEW_W / 2 - w / 2, VIEW_H - 84, w, 34, 17);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, VIEW_H - 66);
}

function overlay(ctx, title, lines, buttons, accent) {
  ctx.fillStyle = 'rgba(10, 13, 22, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#1b2133';
  roundRect(ctx, VIEW_W / 2 - 330, 120, 660, 440, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  roundRect(ctx, VIEW_W / 2 - 330, 120, 660, 440, 16);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, VIEW_W / 2, 185);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '16px sans-serif';
  let y = 225;
  for (const line of lines) {
    ctx.fillText(line, VIEW_W / 2, y);
    y += 26;
  }
  const drawn = [];
  for (const b of buttons) {
    ctx.fillStyle = b.accent ? accent : '#2a3350';
    roundRect(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    drawn.push(b);
  }
  return drawn;
}

export function drawTitleScreen(ctx, buttons) {
  return overlay(
    ctx,
    'MOTH',
    [
      'Night at the Meridian Archive',
      '',
      'You are Moth, a burglar with one night to lift three relics',
      'and slip out the green door — unseen.',
      '',
      'WASD / Arrows — move      Shift — sneak (slow, quiet, harder to spot)',
      'Hide in bushes and crates. Lamplight doubles how fast guards spot you.',
      'A guard who sees you fills his meter: "?" means curious, "!" means run.',
      'Break line of sight for a few seconds and the alarm cools.',
      'Listen: footsteps tell you where a guard is.',
    ],
    buttons,
    '#7a5fd0',
  );
}

export function drawLevelClearScreen(ctx, levelName, bonus, score, buttons) {
  return overlay(
    ctx,
    'LEVEL CLEAR',
    [
      `${levelName} — relics pocketed, door reached, nobody the wiser.`,
      '',
      `Level bonus: +${bonus}`,
      `Score: ${score}`,
      '',
      'The next floor is darker, and the wardens walk tighter beats.',
    ],
    buttons,
    COLORS.exit,
  );
}

export function drawCaughtScreen(ctx, buttons) {
  return overlay(
    ctx,
    'CAUGHT!',
    [
      'A warden laid a hand on your shoulder.',
      'The archive keeps its relics — this time.',
      '',
      'Press R or click Retry to slip back in.',
    ],
    buttons,
    COLORS.danger,
  );
}

export function drawGameClearScreen(ctx, score, totalTime, buttons) {
  return overlay(
    ctx,
    'CLEAN GETAWAY',
    [
      'Three relics. Three floors. Not a single warden raised the alarm',
      'long enough to matter. The Meridian Archive will never know.',
      '',
      `Final score: ${score}`,
      `Total time: ${totalTime}`,
      '',
      'MOTH — Night at the Meridian Archive',
    ],
    buttons,
    COLORS.relic,
  );
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10, 13, 22, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED — press P to continue', VIEW_W / 2, VIEW_H / 2);
}

// Exposed for the HUD's light-state label.
export function playerIsLit(player, lamps) {
  return isLit(player.x, player.y, lamps);
}
