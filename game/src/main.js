// Lantern Keep — main: game state, loop, waves, economy, win/lose.
import {
  VIEW_W, VIEW_H, COLS, ROWS, CELL,
  TOWERS, WAVES, START_EMBERS, WAVE_CLEAR_BONUS, KILL_SCORE,
} from './config.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { spawnEnemy, updateEnemy } from './enemies.js';
import { createTower, towerStats, upgradeCost, sellValue, updateTowers, updateProjectiles } from './towers.js';
import { createFx } from './particles.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';
import * as render from './render.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const input = createInput(canvas, { viewW: VIEW_W, viewH: VIEW_H, cell: CELL, cols: COLS, rows: ROWS });

const game = {
  state: 'title', // title | playing | victory | defeat
  paused: false,
  world: createWorld(),
  towers: [],
  enemies: [],
  projectiles: [],
  fx: createFx(),
  embers: START_EMBERS,
  score: 0,
  kills: 0,
  wave: 0,
  totalWaves: WAVES.length,
  waveInProgress: false,
  spawnQueue: [],
  spawnTimer: 0,
  selectedType: 'ember',
  selectedTower: null,
  time: 0,
  lanternFlash: 0,
  emberTimer: 0,
};

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function towerAt(col, row) {
  return game.towers.find((t) => t.col === col && t.row === row) || null;
}

function startWave() {
  if (game.state !== 'playing' || game.waveInProgress) return;
  if (game.wave >= game.totalWaves) return;
  game.wave += 1;
  game.waveInProgress = true;
  game.spawnQueue = [];
  for (const group of WAVES[game.wave - 1]) {
    for (let i = 0; i < group.count; i++) {
      game.spawnQueue.push({ type: group.type, delay: group.gap });
    }
  }
  game.spawnTimer = 0.5;
  sfx.waveStart();
  setStatus(`Wave ${game.wave} of ${game.totalWaves} — the shadows approach.`);
}

function endWave() {
  game.waveInProgress = false;
  const bonus = WAVE_CLEAR_BONUS + game.wave * 5;
  game.embers += bonus;
  game.fx.floatText(game.world.lanternPos.x, game.world.lanternPos.y - 60, `Wave bonus +${bonus} 🔥`, '#ffb347');
  sfx.waveClear();
  if (game.wave >= game.totalWaves) {
    game.state = 'victory';
    sfx.victory();
    setStatus(`Victory! All ${game.totalWaves} waves cleared. Score ${game.score}.`);
  } else {
    setStatus(`Wave ${game.wave} cleared. Bonus ${bonus} embers. Press Space for wave ${game.wave + 1}.`);
  }
}

function resetGame() {
  game.state = 'playing';
  game.paused = false;
  game.world = createWorld();
  game.towers = [];
  game.enemies = [];
  game.projectiles = [];
  game.fx = createFx();
  game.embers = START_EMBERS;
  game.score = 0;
  game.kills = 0;
  game.wave = 0;
  game.waveInProgress = false;
  game.spawnQueue = [];
  game.spawnTimer = 0;
  game.selectedType = 'ember';
  game.selectedTower = null;
  game.time = 0;
  setStatus('Lantern Keep — build towers, then press Space to start wave 1.');
}

function placeTower(col, row) {
  const def = TOWERS[game.selectedType];
  if (!game.world.isBuildable(col, row)) {
    sfx.deny();
    return;
  }
  if (towerAt(col, row)) {
    game.selectedTower = towerAt(col, row);
    return;
  }
  if (game.embers < def.cost) {
    sfx.deny();
    game.fx.floatText(col * CELL + CELL / 2, row * CELL, 'Not enough embers!', '#ff8c8c');
    return;
  }
  game.embers -= def.cost;
  const t = createTower(game.selectedType, col, row);
  game.towers.push(t);
  game.selectedTower = t;
  game.fx.burst(t.x, t.y, def.color, 14, 90);
  sfx.place();
}

function upgradeSelected() {
  const tw = game.selectedTower;
  if (!tw || tw.level >= 3) {
    sfx.deny();
    return;
  }
  const cost = upgradeCost(tw.type, tw.level);
  if (game.embers < cost) {
    sfx.deny();
    return;
  }
  game.embers -= cost;
  tw.level += 1;
  game.fx.burst(tw.x, tw.y, '#ffd166', 18, 120);
  sfx.upgrade();
}

function sellSelected() {
  const tw = game.selectedTower;
  if (!tw) return;
  const value = sellValue(tw.type, tw.level);
  game.embers += value;
  game.towers = game.towers.filter((t) => t !== tw);
  game.fx.floatText(tw.x, tw.y - 20, `+${value} 🔥`, '#ffb347');
  game.selectedTower = null;
  sfx.coin();
}

function handleClick(cell, pos) {
  if (!cell) {
    game.selectedTower = null;
    return;
  }
  // Wave start button (top-right, only between waves).
  if (!game.waveInProgress && game.state === 'playing' && pos && pos.x > VIEW_W - 150 && pos.x < VIEW_W - 16 && pos.y > 60 && pos.y < 98) {
    startWave();
    return;
  }
  const existing = towerAt(cell.col, cell.row);
  if (existing) {
    game.selectedTower = existing;
    return;
  }
  if (game.world.isBuildable(cell.col, cell.row)) {
    placeTower(cell.col, cell.row);
  } else {
    game.selectedTower = null;
  }
}

function update(dt) {
  game.time += dt;
  game.lanternFlash = Math.max(0, game.lanternFlash - dt * 3);

  // Ambient embers drifting up from the lantern.
  game.emberTimer -= dt;
  if (game.emberTimer <= 0) {
    game.emberTimer = 0.35;
    game.fx.emberDrift(game.world.lanternPos.x, game.world.lanternPos.y - 20);
  }

  // Spawning.
  if (game.waveInProgress && game.spawnQueue.length > 0) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const next = game.spawnQueue.shift();
      game.enemies.push(spawnEnemy(next.type, game.wave, game.world.pathPx));
      game.spawnTimer = next.delay;
    }
  }

  // Towers + projectiles.
  updateTowers(game.towers, game.projectiles, game.enemies, dt, game.time, (type) => {
    if (type === 'frost') sfx.frost();
    else if (type === 'prism') sfx.prism();
    else sfx.shoot();
  });
  updateProjectiles(game.projectiles, game.enemies, dt, game.time, (p, e) => {
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      game.kills += 1;
      game.score += KILL_SCORE;
      game.embers += e.reward;
      game.fx.burst(e.x, e.y, e.color, 16, 110);
      game.fx.burst(e.x, e.y, '#ffd166', 6, 60);
      game.fx.floatText(e.x, e.y - e.radius - 14, `+${e.reward} 🔥`, '#ffb347');
      sfx.kill();
      if (Math.random() < 0.3) sfx.coin();
    }
  });

  // Enemies.
  for (const e of game.enemies) {
    updateEnemy(e, dt, game.world.pathPx, game.time);
    if (e.reached && !e.dead) {
      e.dead = true;
      game.world.lanternHp -= e.damage;
      game.lanternFlash = 1;
      game.fx.addShake(5);
      game.fx.burst(game.world.lanternPos.x, game.world.lanternPos.y, '#ff5d5d', 18, 130);
      sfx.lanternHit();
      setStatus(`A ${e.name} struck the lantern! ${game.world.lanternHp} HP left.`);
      if (game.world.lanternHp <= 0) {
        game.world.lanternHp = 0;
        game.state = 'defeat';
        sfx.defeat();
        setStatus(`Defeat on wave ${game.wave}. Score ${game.score}. Press R to try again.`);
      }
    }
  }
  game.enemies = game.enemies.filter((e) => !e.dead);

  // Wave cleared?
  if (game.waveInProgress && game.spawnQueue.length === 0 && game.enemies.length === 0) {
    endWave();
  }

  game.fx.update(dt);
}

function handleInput() {
  // Keys first: a number key pressed in the same frame as a click must
  // already have switched the selected tower before the click places one.
  if (input.wasPressed(' ')) {
    unlockAudio();
    if (game.state === 'title') resetGame();
    else if (game.state === 'playing' && !game.paused) startWave();
    else if (game.state === 'victory' || game.state === 'defeat') resetGame();
  }
  if (input.wasPressed('enter')) {
    unlockAudio();
    if (game.state === 'title') resetGame();
    else if (game.state === 'victory' || game.state === 'defeat') resetGame();
  }
  if (input.wasPressed('r')) {
    if (game.state !== 'title') resetGame();
  }
  if (input.wasPressed('p')) {
    if (game.state === 'playing') game.paused = !game.paused;
  }
  if (input.wasPressed('escape')) {
    game.selectedTower = null;
  }
  if (input.wasPressed('m')) {
    const m = toggleMute();
    setStatus(m ? 'Sound muted.' : 'Sound on.');
  }
  if (input.wasPressed('1')) game.selectedType = 'ember';
  if (input.wasPressed('2')) game.selectedType = 'frost';
  if (input.wasPressed('3')) game.selectedType = 'prism';
  if (input.wasPressed('u')) upgradeSelected();
  if (input.wasPressed('x')) sellSelected();

  const { cell, pos } = input.consumeClick();
  if (cell || pos) {
    unlockAudio();
    if (game.state === 'title') {
      resetGame();
      return;
    }
    if (game.state === 'victory' || game.state === 'defeat') {
      resetGame();
      return;
    }
    if (game.state === 'playing' && !game.paused) {
      handleClick(cell, pos);
    }
  }
}

function draw() {
  ctx.save();
  ctx.translate(game.fx.shakeX, game.fx.shakeY);
  render.drawBackground(ctx, game.time);
  render.drawPath(ctx, game.world);

  if (game.state === 'title') {
    render.drawLantern(ctx, game.world, game.time);
    render.drawTitle(ctx, game.time);
    ctx.restore();
    return;
  }

  render.drawTowers(ctx, game.towers, game.selectedTower, input.mouseCell, game.world, game.selectedType, game.embers);
  render.drawEnemies(ctx, game.enemies, game.time);
  render.drawProjectiles(ctx, game.projectiles);
  render.drawLantern(ctx, game.world, game.time);
  render.drawFx(ctx, game.fx);
  render.drawHud(ctx, game);

  if (game.state === 'victory') render.drawEndScreen(ctx, game, true);
  else if (game.state === 'defeat') render.drawEndScreen(ctx, game, false);
  else if (game.paused) render.drawPaused(ctx);

  ctx.restore();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleInput();
  if (game.state === 'playing' && !game.paused) {
    update(dt);
  } else {
    // Keep ambient FX alive on title/end screens.
    game.time += dt;
    game.fx.update(dt);
    game.emberTimer -= dt;
    if (game.emberTimer <= 0) {
      game.emberTimer = 0.4;
      game.fx.emberDrift(game.world.lanternPos.x, game.world.lanternPos.y - 20);
    }
  }
  draw();
  requestAnimationFrame(loop);
}

setStatus('Lantern Keep — click or press Space to begin.');
requestAnimationFrame(loop);
