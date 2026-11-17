// Lantern Keep — best-game-01 entrypoint (Node 22, standard library only).
//
// The game lives in this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html plus its ES modules, no library and no
// network request). This program hands it in: it copies game/ and screenshots/
// from beside this file to /output and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun library.
//
// Lantern Keep is a tower-defense game: build Ember, Frost and Prism lanterns
// along the stone path, spend the embers slain shadows drop, and keep the Great
// Lantern burning through all 10 waves (the Hollow King waits on wave 10).
// The three screenshots in screenshots/ are the cover (title), a mid-wave shot
// with towers firing, and the defeat screen — the first by name is the cover.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Walk a directory tree and count its files and bytes, so the build can say
// what it handed in and warn before the scorer refuses an oversized entry.
function summarize(dir) {
  let files = 0;
  let bytes = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else {
        files += 1;
        bytes += s.size;
      }
    }
  };
  walk(dir);
  return { files, bytes };
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Report the hand-in and warn (never fail) when a screenshot is missing or
// over the scorer's 256 KiB cap, so a bad build is loud instead of silent.
const game = summarize(join(here, 'game'));
const shots = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((n) => /\.(png|jpe?g)$/i.test(n)).sort()
  : [];
console.log(`Lantern Keep: game/ ${game.files} files, ${(game.bytes / 1024).toFixed(1)} KiB`);
for (const shot of shots) {
  const size = statSync(join(here, 'screenshots', shot)).size;
  const over = size > 262144 ? ' (OVER 256 KiB!)' : '';
  console.log(`  screenshot ${shot} ${(size / 1024).toFixed(1)} KiB${over}`);
}
if (shots.length === 0) console.log('  warning: no screenshots found in screenshots/');

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
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
console.log('Lantern Keep: dossier.json written');
