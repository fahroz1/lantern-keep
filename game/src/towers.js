// Lantern Keep — towers: placement, targeting, projectiles, upgrades.
import { TOWERS, MAX_LEVEL, CELL } from './config.js';
import { cellCenter } from './world.js';
import { applySlow } from './enemies.js';
import { sfx } from './audio.js';

export function towerStats(type, level) {
  const def = TOWERS[type];
  return {
    damage: Math.round(def.damage * Math.pow(1.55, level - 1)),
    range: Math.round(def.range * Math.pow(1.12, level - 1)),
    fireRate: def.fireRate,
    projectileSpeed: def.projectileSpeed,
  };
}

export function upgradeCost(type, level) {
  // Cost to go from `level` to `level + 1`.
  return Math.round(TOWERS[type].cost * 0.8 * level);
}

export function sellValue(type, level) {
  let spent = TOWERS[type].cost;
  for (let l = 1; l < level; l++) spent += upgradeCost(type, l);
  return Math.floor(spent * 0.7);
}

export function createTower(type, col, row) {
  const pos = cellCenter(col, row);
  return {
    type,
    col,
    row,
    x: pos.x,
    y: pos.y,
    level: 1,
    cooldown: 0,
    angle: -Math.PI / 2,
    flash: 0,
  };
}

// Find the enemy furthest along the path (highest waypoint, then furthest x+y) in range.
function pickTarget(tower, stats, enemies) {
  let best = null;
  let bestScore = -1;
  for (const e of enemies) {
    if (e.dead || e.reached) continue;
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d > stats.range + e.radius) continue;
    const score = e.wp * 10000 + e.x + e.y;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

export function updateTowers(towers, projectiles, enemies, dt, now, onShoot) {
  for (const t of towers) {
    t.cooldown -= dt;
    t.flash = Math.max(0, t.flash - dt * 6);
    const stats = towerStats(t.type, t.level);
    const target = pickTarget(t, stats, enemies);
    if (!target) continue;
    t.angle = Math.atan2(target.y - t.y, target.x - t.x);
    if (t.cooldown > 0) continue;
    t.cooldown = 1 / stats.fireRate;
    t.flash = 1;
    const def = TOWERS[t.type];
    projectiles.push({
      x: t.x,
      y: t.y,
      target,
      speed: stats.projectileSpeed,
      damage: stats.damage,
      type: t.type,
      color: def.color,
      slowPct: def.slowPct || 0,
      slowSecs: def.slowSecs || 0,
    });
    if (onShoot) onShoot(t.type);
  }
}

export function updateProjectiles(projectiles, enemies, dt, now, onHit) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const t = p.target;
    if (!t || t.dead || t.reached) {
      projectiles.splice(i, 1);
      continue;
    }
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step + t.radius * 0.6) {
      // Hit.
      t.hp -= p.damage;
      if (p.slowPct > 0) applySlow(t, p.slowPct, p.slowSecs, now);
      if (onHit) onHit(p, t);
      projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }
}
