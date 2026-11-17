// Lantern Keep — enemies: shadows that walk the path toward the Great Lantern.
import { ENEMIES } from './config.js';

let nextId = 1;

export function spawnEnemy(type, wave, pathPx) {
  const def = ENEMIES[type];
  const hpScale = 1 + (wave - 1) * 0.18;
  const speedScale = 1 + (wave - 1) * 0.02;
  return {
    id: nextId++,
    type,
    name: def.name,
    x: pathPx[0].x,
    y: pathPx[0].y,
    wp: 1, // next waypoint index
    maxHp: Math.round(def.hp * hpScale),
    hp: Math.round(def.hp * hpScale),
    speed: def.speed * speedScale,
    damage: def.damage,
    reward: def.reward,
    radius: def.radius,
    color: def.color,
    eye: def.eye,
    slowUntil: 0,
    slowPct: 0,
    wobble: Math.random() * Math.PI * 2,
    dead: false,
    reached: false,
  };
}

// Move along the path. Returns 'reached' when it arrives at the lantern.
export function updateEnemy(e, dt, pathPx, now) {
  if (e.dead || e.reached) return;
  let speed = e.speed;
  if (now < e.slowUntil) speed *= 1 - e.slowPct;
  let move = speed * dt;
  while (move > 0 && !e.reached) {
    const target = pathPx[e.wp];
    if (!target) {
      e.reached = true;
      break;
    }
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= move) {
      e.x = target.x;
      e.y = target.y;
      move -= dist;
      e.wp += 1;
      if (e.wp >= pathPx.length) {
        e.reached = true;
      }
    } else {
      e.x += (dx / dist) * move;
      e.y += (dy / dist) * move;
      move = 0;
    }
  }
  e.wobble += dt * 6;
}

export function applySlow(e, pct, secs, now) {
  e.slowPct = Math.max(e.slowPct, pct);
  e.slowUntil = Math.max(e.slowUntil, now + secs);
}
