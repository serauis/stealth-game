// shots.js — staged screenshot scenes, driven by ?shot= and ?seed=.
// Every shot is deterministic: fixed positions, fixed suspicion values, a
// frozen animation clock, no running update loop while the shot is held.
// Each scene is a state real play reaches: a chase at full alarm, a near
// miss survived in shadow, a vault mid-heist, and the escape itself.
import { GUARD_STATE } from './guards.js';

export const SHOT_NAMES = ['cover', 'patrol', 'spotted', 'win'];

export function parseShot(search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1') || 1;
  return { shot: SHOT_NAMES.includes(shot) ? shot : null, seed };
}

// Put the game into a composed, readable scene for one named shot.
// The caller renders one frame afterwards and holds it.
export function stageShot(game, shot) {
  const g = game;
  if (shot === 'cover') {
    // CORNERED — Level 2, the Archive, mid-chase. The Moon Ledger is
    // already pocketed; a warden at full alarm has Moth pinned against
    // the crate while a second, suspicious warden cuts off the top.
    g.startLevel(1, { skipIntro: true });
    g.screen = 'playing';
    g.relics[0].taken = true; // Moon Ledger
    g.score = 100;
    g.levelTime = 96;
    g.player.x = 905;
    g.player.y = 612;
    g.player.sneaking = false;
    g.player.hidden = false;
    g.player.moving = true;
    g.player.facing = 0.5; // fleeing toward the crate — and the wall
    const hunter = g.guards[0];
    hunter.x = 838;
    hunter.y = 580;
    hunter.facing = Math.atan2(612 - 580, 905 - 838);
    hunter.state = GUARD_STATE.CHASE;
    hunter.suspicion = 100;
    hunter.lastSeen = { x: 905, y: 612 };
    const cutter = g.guards[1];
    cutter.x = 1035;
    cutter.y = 462;
    cutter.facing = Math.atan2(612 - 462, 905 - 1035);
    cutter.state = GUARD_STATE.SUSPICIOUS;
    cutter.suspicion = 68;
    cutter.lastSeen = { x: 905, y: 612 };
    const far = g.guards[2];
    far.x = 430;
    far.y = 120;
    far.facing = 0; // still patrolling the top stacks, unaware
    far.state = GUARD_STATE.PATROL;
    far.suspicion = 0;
    g.frozenTime = 0.6;
    g.hint = '';
  } else if (shot === 'patrol') {
    // THE SHADOW HOLDS — Level 1, the Gallery. A warden's cone is full
    // on Moth, but Moth is sneaking in darkness: the meter climbs so
    // slowly that the "?" fades before it ever becomes a "!".
    g.startLevel(0, { skipIntro: true });
    g.screen = 'playing';
    g.levelTime = 41;
    g.player.x = 288;
    g.player.y = 432;
    g.player.sneaking = true;
    g.player.hidden = false;
    g.player.facing = Math.PI; // watching the warden, back to the dark
    const warden = g.guards[1];
    warden.x = 110;
    warden.y = 430;
    warden.facing = 0; // cone sweeping straight across Moth
    warden.state = GUARD_STATE.SUSPICIOUS;
    warden.suspicion = 45;
    warden.lastSeen = { x: 288, y: 432 };
    const top = g.guards[0];
    top.x = 700;
    top.y = 150;
    top.facing = Math.PI / 2; // looking down the gallery
    top.state = GUARD_STATE.PATROL;
    top.suspicion = 12;
    g.frozenTime = 1.1;
    g.hint = '';
  } else if (shot === 'spotted') {
    // THE VAULT — Level 3, mid-heist. One relic (the Jade Scarab) is
    // pocketed, two still glow; four wardens walk their beats and one
    // is distracted by a noise below while Moth crosses the middle.
    g.startLevel(2, { skipIntro: true });
    g.screen = 'playing';
    g.relics[1].taken = true; // Jade Scarab
    g.score = 100;
    g.levelTime = 133;
    g.player.x = 640;
    g.player.y = 350;
    g.player.sneaking = true;
    g.player.hidden = false;
    g.player.facing = -Math.PI / 2; // eyes on the Crown of Tides
    const top = g.guards[0];
    top.x = 520;
    top.y = 122;
    top.facing = 0;
    top.state = GUARD_STATE.PATROL;
    top.suspicion = 0;
    const distracted = g.guards[1];
    distracted.x = 95;
    distracted.y = 470;
    distracted.facing = Math.atan2(600 - 470, 430 - 95);
    distracted.state = GUARD_STATE.SUSPICIOUS;
    distracted.suspicion = 38;
    distracted.lastSeen = { x: 430, y: 600 };
    const bottom = g.guards[2];
    bottom.x = 880;
    bottom.y = 652;
    bottom.facing = Math.PI;
    bottom.state = GUARD_STATE.PATROL;
    bottom.suspicion = 0;
    const right = g.guards[3];
    right.x = 1150;
    right.y = 330;
    right.facing = Math.PI;
    right.state = GUARD_STATE.PATROL;
    right.suspicion = 0;
    g.frozenTime = 2.2;
    g.hint = '';
  } else if (shot === 'win') {
    // THE CLEAN GETAWAY — Level 3, the last second of the night. All
    // three relics are pocketed, the exit door burns bright, Moth is
    // stepping through it, and not one warden knows he was ever there.
    g.startLevel(2, { skipIntro: true });
    g.screen = 'playing';
    for (const relic of g.relics) relic.taken = true;
    g.score = 2680;
    g.levelTime = 187;
    g.player.x = 1225;
    g.player.y = 670;
    g.player.sneaking = false;
    g.player.hidden = false;
    g.player.moving = true;
    g.player.facing = 0.4; // out the door
    const top = g.guards[0];
    top.x = 350;
    top.y = 120;
    top.facing = 0;
    top.state = GUARD_STATE.PATROL;
    top.suspicion = 0;
    const left = g.guards[1];
    left.x = 95;
    left.y = 300;
    left.facing = Math.PI / 2;
    left.state = GUARD_STATE.PATROL;
    left.suspicion = 0;
    const bottom = g.guards[2];
    bottom.x = 700;
    bottom.y = 650;
    bottom.facing = Math.PI;
    bottom.state = GUARD_STATE.PATROL;
    bottom.suspicion = 8;
    const right = g.guards[3];
    right.x = 1150;
    right.y = 520;
    right.facing = -Math.PI / 2;
    right.state = GUARD_STATE.PATROL;
    right.suspicion = 0;
    g.frozenTime = 3.0;
    g.hint = '';
  }
}
