// main.ts — the make.fun hand-in for MOTH (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the kit's vendored buildDossier. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Pre-flight: the gate refuses more than 4 screenshots or one over 256 KiB,
// so check the copied set (sorted, for a deterministic error) before the
// dossier is written rather than handing in a doomed entry.
const shotNames = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).sort()
  : [];
if (shotNames.length > 4) throw new Error(`too many screenshots: ${shotNames.length}`);
for (const name of shotNames) {
  const { size } = statSync(join(here, 'screenshots', name));
  if (size > 262144) throw new Error(`screenshot over 256 KiB: ${name}`);
}

// The same courtesy for game/: the gate caps it at 993 entries and 48 MiB
// in all, so walk the tree once here and refuse a hand-in the scorer would
// refuse anyway, naming the count that broke the cap.
function walkGame(dir, prefix, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    acc.entries += 1;
    if (entry.isDirectory()) walkGame(join(dir, entry.name), rel, acc);
    else acc.bytes += statSync(join(dir, entry.name)).size;
    acc.paths.push(rel);
  }
  return acc;
}
const gameTree = walkGame(join(here, 'game'), '', { entries: 0, bytes: 0, paths: [] });
if (gameTree.entries > 993) throw new Error(`too many game entries: ${gameTree.entries}`);
if (gameTree.bytes > 50331648) throw new Error(`game too large: ${gameTree.bytes} bytes`);

// And the quietest cap of the five: no path under game/ may run past 1,000
// UTF-8 bytes. Byte length, not character count — a name full of multibyte
// characters is longer than it looks, so measure it the way the gate does.
for (const rel of gameTree.paths) {
  if (Buffer.byteLength(rel, 'utf8') > 1000) {
    throw new Error(`game path over 1000 bytes: ${rel}`);
  }
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
