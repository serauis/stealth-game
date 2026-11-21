// shots.js — staged screenshot scenes, driven by ?shot= and ?seed=.
// Every shot is deterministic: fixed positions, fixed suspicion values, a
// frozen animation clock, no running update loop while the shot is held.
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
    g.startLevel(0, { skipIntro: true });
    g.screen = 'playing';
    // Moth sneaking in shadow beside the crates, cones crossing the room.
    g.player.x = 470;
    g.player.y = 590;
    g.player.sneaking = true;
    g.player.hidden = false;
    const guardA = g.guards[0];
    guardA.x = 640;
    guardA.y = 150;
    guardA.facing = Math.PI / 2; // looking down the gallery
    guardA.state = GUARD_STATE.PATROL;
    guardA.suspicion = 22;
    const guardB = g.guards[1];
    guardB.x = 110;
    guardB.y = 420;
    guardB.facing = 0; // looking right, cone sweeping past Moth
    guardB.state = GUARD_STATE.PATROL;
    guardB.suspicion = 0;
    g.frozenTime = 1.4;
    g.hint = '';
  } else if (shot === 'patrol') {
    g.startLevel(1, { skipIntro: true });
    g.screen = 'playing';
    // Moth hidden in a bush while a warden's cone sweeps past.
    g.player.x = 425;
    g.player.y = 350;
    g.player.hidden = true;
    g.player.sneaking = true;
    const guardA = g.guards[0];
    guardA.x = 620;
    guardA.y = 120;
    guardA.facing = Math.PI / 2;
    guardA.state = GUARD_STATE.PATROL;
    guardA.suspicion = 0;
    const guardB = g.guards[1];
    guardB.x = 120;
    guardB.y = 470;
    guardB.facing = Math.PI / 2;
    guardB.state = GUARD_STATE.PATROL;
    guardB.suspicion = 12;
    const guardC = g.guards[2];
    guardC.x = 880;
    guardC.y = 650;
    guardC.facing = Math.PI;
    guardC.state = GUARD_STATE.PATROL;
    guardC.suspicion = 0;
    g.frozenTime = 2.1;
    g.hint = '';
  } else if (shot === 'spotted') {
    g.startLevel(1, { skipIntro: true });
    g.screen = 'playing';
    // Caught in the lamplight: full meter, red cone, the warden closing in.
    g.player.x = 760;
    g.player.y = 260;
    g.player.sneaking = false;
    g.player.hidden = false;
    const guardA = g.guards[0];
    guardA.x = 700;
    guardA.y = 250;
    guardA.facing = Math.atan2(260 - 250, 760 - 700);
    guardA.state = GUARD_STATE.CHASE;
    guardA.suspicion = 100;
    guardA.lastSeen = { x: 760, y: 260 };
    const guardB = g.guards[1];
    guardB.x = 120;
    guardB.y = 500;
    guardB.facing = 0;
    guardB.state = GUARD_STATE.SUSPICIOUS;
    guardB.suspicion = 62;
    guardB.lastSeen = { x: 760, y: 260 };
    const guardC = g.guards[2];
    guardC.x = 950;
    guardC.y = 650;
    guardC.facing = -Math.PI / 2;
    guardC.state = GUARD_STATE.PATROL;
    guardC.suspicion = 0;
    g.frozenTime = 0.6;
    g.hint = '';
  } else if (shot === 'win') {
    g.startLevel(0, { skipIntro: true });
    g.screen = 'gameclear';
    g.score = 2450;
    g.totalTime = 312.4;
    g.frozenTime = 3.0;
    g.hint = '';
  }
}
