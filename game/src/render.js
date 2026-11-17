// Lantern Keep — all drawing: background, path, towers, enemies, lantern, HUD, screens.
import { VIEW_W, VIEW_H, COLS, ROWS, CELL, TOWERS, ENEMIES } from './config.js';
import { cellCenter } from './world.js';
import { towerStats, upgradeCost, sellValue } from './towers.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBackground(ctx, t) {
  // Deep night gradient.
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0d1026');
  g.addColorStop(0.55, '#141a33');
  g.addColorStop(1, '#0a0d1f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Faint stars.
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const x = (i * 137.5) % VIEW_W;
    const y = (i * 89.3) % VIEW_H;
    const tw = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.globalAlpha = tw * 0.5;
    ctx.fillStyle = '#cdd7ff';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}

export function drawPath(ctx, world) {
  // Path tiles: worn cobbles.
  for (const key of world.pathSet) {
    const [c, r] = key.split(',').map(Number);
    const x = c * CELL;
    const y = r * CELL;
    ctx.fillStyle = '#232a4a';
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x + 6, y + 6, CELL - 12, 3);
    ctx.fillRect(x + 6, y + CELL - 9, CELL - 12, 3);
  }
  // Build plots: faint grid dots.
  ctx.fillStyle = 'rgba(160,180,255,0.10)';
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (!world.isBuildable(c, r)) continue;
      ctx.fillRect(c * CELL + CELL / 2 - 1, r * CELL + CELL / 2 - 1, 2, 2);
    }
  }
}

export function drawLantern(ctx, world, t) {
  const { x, y } = world.lanternPos;
  const hpFrac = Math.max(0, world.lanternHp / world.lanternMaxHp);
  const pulse = 1 + Math.sin(t * 2.2) * 0.06;

  // Warm glow.
  const glow = ctx.createRadialGradient(x, y, 8, x, y, 150 * pulse);
  glow.addColorStop(0, `rgba(255, 170, 60, ${0.34 * hpFrac + 0.06})`);
  glow.addColorStop(0.5, 'rgba(255, 140, 40, 0.10)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 160, y - 160, 320, 320);

  // Stone base.
  ctx.fillStyle = '#3a3f5e';
  roundRect(ctx, x - 26, y - 6, 52, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#2c3050';
  ctx.fillRect(x - 26, y + 18, 52, 10);

  // Glass + flame.
  ctx.fillStyle = '#ffe9a8';
  roundRect(ctx, x - 18, y - 34, 36, 30, 8);
  ctx.fill();
  const flameH = 12 + Math.sin(t * 5) * 2.5;
  ctx.fillStyle = '#ff8c1a';
  ctx.beginPath();
  ctx.ellipse(x, y - 22, 7, flameH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.ellipse(x, y - 20, 3.5, flameH * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cap.
  ctx.fillStyle = '#4a4f73';
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 34);
  ctx.lineTo(x, y - 48);
  ctx.lineTo(x + 22, y - 34);
  ctx.closePath();
  ctx.fill();

  // HP ring.
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(x, y, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = hpFrac > 0.5 ? '#7dff9b' : hpFrac > 0.25 ? '#ffd166' : '#ff5d5d';
  ctx.beginPath();
  ctx.arc(x, y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpFrac);
  ctx.stroke();
  ctx.lineWidth = 1;
}

export function drawTowers(ctx, towers, selectedTower, hoverCell, world, selectedType, embers) {
  for (const tw of towers) {
    const def = TOWERS[tw.type];
    const stats = towerStats(tw.type, tw.level);
    const isSel = selectedTower === tw;

    // Range ring for the selected tower.
    if (isSel) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.arc(tw.x, tw.y, stats.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(tw.x, tw.y, stats.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Base.
    ctx.fillStyle = '#2e3352';
    ctx.beginPath();
    ctx.arc(tw.x, tw.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isSel ? '#ffffff' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = isSel ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(tw.x, tw.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Rotating head (aims at target).
    const flash = tw.flash;
    ctx.save();
    ctx.translate(tw.x, tw.y);
    ctx.rotate(tw.angle);
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, 11 + flash * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(6, -2.5, 12, 5);
    ctx.restore();

    // Level pips.
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < tw.level; i++) {
      ctx.beginPath();
      ctx.arc(tw.x - 10 + i * 10, tw.y + 26, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ghost preview while placing.
  if (hoverCell && world.isBuildable(hoverCell.col, hoverCell.row) && selectedType) {
    const def = TOWERS[selectedType];
    const pos = cellCenter(hoverCell.col, hoverCell.row);
    const affordable = embers >= def.cost;
    ctx.globalAlpha = affordable ? 0.75 : 0.35;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = affordable ? '#ffffff' : '#ff5d5d';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, def.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

export function drawEnemies(ctx, enemies, t) {
  for (const e of enemies) {
    if (e.dead || e.reached) continue;
    const wob = Math.sin(e.wobble) * 2;
    const slowed = t < e.slowUntil;

    // Shadow body.
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + wob * 0.4, e.radius, e.radius * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rim.
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + wob * 0.4, e.radius, e.radius * 0.86, 0, Math.PI * 0.9, Math.PI * 1.7);
    ctx.stroke();
    // Eyes.
    const eyeY = e.y - e.radius * 0.18 + wob * 0.4;
    ctx.fillStyle = e.eye;
    ctx.beginPath();
    ctx.arc(e.x - e.radius * 0.36, eyeY, 2.6, 0, Math.PI * 2);
    ctx.arc(e.x + e.radius * 0.36, eyeY, 2.6, 0, Math.PI * 2);
    ctx.fill();
    // Slow tint.
    if (slowed) {
      ctx.fillStyle = 'rgba(125,215,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + wob * 0.4, e.radius + 2, e.radius * 0.86 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // HP bar.
    const frac = Math.max(0, e.hp / e.maxHp);
    const bw = e.radius * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(e.x - bw / 2, e.y - e.radius - 10, bw, 4);
    ctx.fillStyle = frac > 0.5 ? '#7dff9b' : frac > 0.25 ? '#ffd166' : '#ff5d5d';
    ctx.fillRect(e.x - bw / 2, e.y - e.radius - 10, bw * frac, 4);
    // Boss crown.
    if (e.type === 'boss') {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(e.x - 14, e.y - e.radius - 2);
      ctx.lineTo(e.x - 7, e.y - e.radius - 12);
      ctx.lineTo(e.x, e.y - e.radius - 4);
      ctx.lineTo(e.x + 7, e.y - e.radius - 12);
      ctx.lineTo(e.x + 14, e.y - e.radius - 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function drawProjectiles(ctx, projectiles) {
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.type === 'prism' ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawFx(ctx, fx) {
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = `bold 14px ${FONT}`;
  for (const t of fx.texts) {
    ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

export function drawHud(ctx, game) {
  const pad = 12;
  // Top bar.
  ctx.fillStyle = 'rgba(6,8,20,0.72)';
  roundRect(ctx, 0, 0, VIEW_W, 52, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 52, VIEW_W, 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText('🏮 Lantern Keep', pad + 4, 27);

  ctx.font = `600 15px ${FONT}`;
  ctx.fillStyle = '#e8ecff';
  const waveText = game.waveInProgress
    ? `Wave ${game.wave} / ${game.totalWaves}`
    : game.wave === 0
      ? `Get ready — Wave 1 of ${game.totalWaves}`
      : `Wave ${game.wave} cleared — next: ${game.wave + 1}`;
  ctx.fillText(waveText, 220, 27);

  // Lantern HP.
  ctx.fillStyle = '#ff8c8c';
  ctx.fillText(`❤ ${game.world.lanternHp}/${game.world.lanternMaxHp}`, 470, 27);
  // Embers.
  ctx.fillStyle = '#ffb347';
  ctx.fillText(`🔥 ${game.embers}`, 580, 27);
  // Score + kills.
  ctx.fillStyle = '#cdd7ff';
  ctx.fillText(`Score ${game.score}  •  Slain ${game.kills}`, 680, 27);

  // Bottom build bar.
  const barY = VIEW_H - 64;
  ctx.fillStyle = 'rgba(6,8,20,0.78)';
  ctx.fillRect(0, barY, VIEW_W, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, barY, VIEW_W, 1);

  const types = ['ember', 'frost', 'prism'];
  types.forEach((type, i) => {
    const def = TOWERS[type];
    const x = 16 + i * 230;
    const sel = game.selectedType === type;
    const afford = game.embers >= def.cost;
    ctx.fillStyle = sel ? 'rgba(255,209,102,0.22)' : 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, barY + 8, 216, 48, 8);
    ctx.fill();
    ctx.strokeStyle = sel ? '#ffd166' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, x, barY + 8, 216, 48, 8);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x + 20, barY + 32, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`[${def.key}] ${def.name}`, x + 34, barY + 23);
    ctx.fillStyle = afford ? '#ffd166' : '#ff8c8c';
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(`🔥 ${def.cost}  •  ${def.desc}`, x + 34, barY + 41);
  });

  // Selected tower panel.
  if (game.selectedTower) {
    const tw = game.selectedTower;
    const def = TOWERS[tw.type];
    const stats = towerStats(tw.type, tw.level);
    const x = 708;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, x, barY + 8, 236, 48, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, x, barY + 8, 236, 48, 8);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${def.name}  Lv ${tw.level}/3`, x + 10, barY + 21);
    ctx.fillStyle = '#cdd7ff';
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(`DMG ${stats.damage}  •  RNG ${stats.range}`, x + 10, barY + 35);
    ctx.fillStyle = '#ffd166';
    const up = tw.level < 3 ? `[U] Upgrade 🔥 ${upgradeCost(tw.type, tw.level)}  •  ` : 'MAX  •  ';
    ctx.fillText(`${up}[X] Sell 🔥 ${sellValue(tw.type, tw.level)}`, x + 10, barY + 49);
  } else {
    ctx.fillStyle = '#9aa5d6';
    ctx.font = `600 11px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('Click a plot to build • Click a tower to upgrade / sell', 716, barY + 26);
    ctx.fillText('[Space] start wave • [P] pause • [M] mute', 716, barY + 42);
  }

  // Wave button.
  if (!game.waveInProgress && game.state === 'playing') {
    const bx = VIEW_W - 150;
    const by = 60;
    ctx.fillStyle = '#ff9a3c';
    roundRect(ctx, bx, by, 134, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#1a1206';
    ctx.font = `bold 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(game.wave === 0 ? '▶ Start Wave 1' : `▶ Start Wave ${game.wave + 1}`, bx + 67, by + 20);
  }

  ctx.textAlign = 'left';
}

export function drawTitle(ctx, t) {
  ctx.fillStyle = 'rgba(5,7,18,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 54px ${FONT}`;
  ctx.fillText('🏮 Lantern Keep', VIEW_W / 2, 190);
  ctx.fillStyle = '#e8ecff';
  ctx.font = `600 19px ${FONT}`;
  ctx.fillText('The shadows are coming. Keep the Great Lantern burning.', VIEW_W / 2, 236);
  ctx.fillStyle = '#9aa5d6';
  ctx.font = `500 15px ${FONT}`;
  ctx.fillText('Build lantern-towers along the path. Slay 10 waves of shadows.', VIEW_W / 2, 268);
  ctx.fillText('If the lantern falls, the dark wins.', VIEW_W / 2, 292);

  // Tower legend.
  const types = ['ember', 'frost', 'prism'];
  types.forEach((type, i) => {
    const def = TOWERS[type];
    const x = VIEW_W / 2 - 270 + i * 270;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, x - 125, 330, 250, 74, 10);
    ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x, 356, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(def.name, x, 382);
    ctx.fillStyle = '#cdd7ff';
    ctx.font = `500 12px ${FONT}`;
    ctx.fillText(`🔥 ${def.cost} — ${def.desc}`, x, 398);
  });

  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 20px ${FONT}`;
  const blink = 0.65 + Math.sin(t * 3) * 0.35;
  ctx.globalAlpha = blink;
  ctx.fillText('Click anywhere or press Space to begin', VIEW_W / 2, 470);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#9aa5d6';
  ctx.font = `500 13px ${FONT}`;
  ctx.fillText('Mouse: build / select  •  1 / 2 / 3: tower type  •  U: upgrade  •  X: sell  •  Space: start wave  •  P: pause', VIEW_W / 2, 510);
  ctx.textAlign = 'left';
}

export function drawEndScreen(ctx, game, won) {
  ctx.fillStyle = 'rgba(5,7,18,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#7dff9b' : '#ff5d5d';
  ctx.font = `bold 48px ${FONT}`;
  ctx.fillText(won ? '👑 The Light Endures!' : '🌑 The Lantern Has Fallen', VIEW_W / 2, 220);
  ctx.fillStyle = '#e8ecff';
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText(
    won
      ? 'All 10 waves are broken. The Hollow King is dust. Dawn comes.'
      : `The shadows broke through on wave ${game.wave}. The dark takes the valley… this time.`,
    VIEW_W / 2,
    268,
  );
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText(`Score ${game.score}   •   Shadows slain ${game.kills}   •   Waves cleared ${won ? 10 : game.wave - 1}`, VIEW_W / 2, 320);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Press R or click to play again', VIEW_W / 2, 380);
  ctx.textAlign = 'left';
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(5,7,18,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = `bold 40px ${FONT}`;
  ctx.fillText('Paused', VIEW_W / 2, VIEW_H / 2);
  ctx.font = `500 16px ${FONT}`;
  ctx.fillStyle = '#cdd7ff';
  ctx.fillText('Press P to resume', VIEW_W / 2, VIEW_H / 2 + 36);
  ctx.textAlign = 'left';
}
