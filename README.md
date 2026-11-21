[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/serauis/stealth-game/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/serauis/stealth-game/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

# MOTH — Night at the Meridian Archive

A top-down 2D stealth game, built for the make.fun best-stealth-game bounty.
You are Moth, a burglar with one night to lift three relics from the Meridian
Archive and slip out the green door — unseen.

## How it plays

- **WASD / Arrow keys** — move. **Shift** — sneak (slower, quieter, harder to spot).
- **Hide** in bushes and crates: guards cannot see you at all inside cover.
- **Lamplight doubles** how fast a guard's detection meter fills; shadow halves it.
- Guards patrol fixed beats with **raycast vision cones** blocked by walls.
  A meter over a guard fills as he sees you: `?` at 35 means curious — he
  comes to look; `!` at 100 means alarm — he chases, and nearby guards join.
  Break line of sight for ~3.5 seconds and the alarm cools.
- **Footsteps tell you where a guard is**: every step is panned and faded by
  distance and direction (synthesized WebAudio, no audio files).
- **Relics** glow gold — walk over one to pocket it (+100). The green **EXIT**
  opens only once every relic on the floor is pocketed.
- Three floors: **The Gallery** (2 guards, 1 relic), **The Archive**
  (3 guards, 2 relics), **The Vault** (4 guards, 3 relics). Level bonus:
  500 − 2×seconds, minimum 100. **P / Esc** pauses, **R** retries after a catch.

## Running it

No build step, no network: open `game/index.html` in desktop Chrome, or serve
`game/` from any static server. `?shot=cover|patrol|spotted|win&seed=1` stages
the four screenshot scenes deterministically.

## Layout

- `game/index.html` — canvas + single module script, no external references
- `game/src/config.js` — all tuning numbers (speeds, detection, scoring)
- `game/src/random.js` — seeded RNG (mulberry32), no `Math.random` in the game
- `game/src/level.js` — the three hand-built floors
- `game/src/vision.js` — cones, line of sight, light/shadow, detection rates
- `game/src/guards.js` — patrol / suspicious / chase / investigate behaviour
- `game/src/player.js` — movement, sneak, noise, hiding, loot, exit
- `game/src/audio.js` — synthesized WebAudio: footsteps, stings, chimes
- `game/src/render.js` — floor, light, cones, entities, HUD, screens
- `game/src/input.js` — keyboard + mouse
- `game/src/shots.js` — deterministic screenshot staging
- `game/src/main.js` — loop and state machine
- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`,
  writes `dossier.json` with the kit's `vendor/makefun-game.ts`)
