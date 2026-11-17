// Lantern Keep — configuration: grid, towers, enemies, waves.
// All numbers are tuned for a 10-wave game that lasts ~8 minutes.

export const VIEW_W = 960;
export const VIEW_H = 640;
export const COLS = 15;
export const ROWS = 10;
export const CELL = 64;

// Path the shadows walk, in grid cells. Last waypoint is the Great Lantern.
export const PATH_CELLS = [
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
  [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8],
  [6, 8], [7, 8], [8, 8], [9, 8], [10, 8],
  [10, 7], [10, 6], [10, 5], [10, 4], [10, 3],
  [11, 3], [12, 3], [12, 4], [12, 5],
];
export const LANTERN_CELL = [12, 5];

// Tower types. cost is in embers. damage/range/fireRate scale with level.
export const TOWERS = {
  ember: {
    name: 'Ember Lantern',
    key: '1',
    cost: 50,
    color: '#ff9a3c',
    glow: '#ff6a00',
    range: 130,
    damage: 14,
    fireRate: 1.6, // shots per second
    projectileSpeed: 320,
    desc: 'Balanced flame damage.',
  },
  frost: {
    name: 'Frost Lantern',
    key: '2',
    cost: 40,
    color: '#7dd7ff',
    glow: '#2aa8ff',
    range: 115,
    damage: 6,
    fireRate: 1.1,
    projectileSpeed: 300,
    slowPct: 0.45, // enemies move at 55% speed
    slowSecs: 1.4,
    desc: 'Slows shadows down.',
  },
  prism: {
    name: 'Prism Lantern',
    key: '3',
    cost: 80,
    color: '#c78bff',
    glow: '#9b4dff',
    range: 170,
    damage: 34,
    fireRate: 0.7,
    projectileSpeed: 460,
    desc: 'Heavy beam, long reach.',
  },
};

// Upgrade: each level multiplies damage by 1.55 and range by 1.12.
// Cost to go from level L to L+1 is round(baseCost * 0.8 * L).
export const MAX_LEVEL = 3;

// Enemy types.
export const ENEMIES = {
  wisp: {
    name: 'Wisp',
    hp: 30,
    speed: 62,
    damage: 1, // lantern HP lost when it arrives
    reward: 6,
    radius: 11,
    color: '#8a7bff',
    eye: '#e8e4ff',
  },
  shade: {
    name: 'Shade',
    hp: 70,
    speed: 42,
    damage: 2,
    reward: 10,
    radius: 14,
    color: '#5b4fd8',
    eye: '#ffd166',
  },
  brute: {
    name: 'Brute',
    hp: 220,
    speed: 26,
    damage: 4,
    reward: 18,
    radius: 19,
    color: '#3d2f8f',
    eye: '#ff5d5d',
  },
  boss: {
    name: 'The Hollow King',
    hp: 1400,
    speed: 22,
    damage: 10,
    reward: 200,
    radius: 28,
    color: '#241a4d',
    eye: '#ff2e63',
  },
};

// Waves: list of {type, count, gap} groups spawned in order.
// hp scales by 1 + (wave-1)*0.18, speed by 1 + (wave-1)*0.02.
export const WAVES = [
  [{ type: 'wisp', count: 8, gap: 0.9 }],
  [{ type: 'wisp', count: 12, gap: 0.7 }, { type: 'shade', count: 3, gap: 1.2 }],
  [{ type: 'wisp', count: 10, gap: 0.6 }, { type: 'shade', count: 6, gap: 1.0 }],
  [{ type: 'shade', count: 10, gap: 0.9 }, { type: 'wisp', count: 12, gap: 0.5 }],
  [{ type: 'brute', count: 3, gap: 1.6 }, { type: 'shade', count: 10, gap: 0.8 }],
  [{ type: 'wisp', count: 20, gap: 0.4 }, { type: 'brute', count: 4, gap: 1.4 }],
  [{ type: 'shade', count: 16, gap: 0.7 }, { type: 'brute', count: 5, gap: 1.3 }],
  [{ type: 'brute', count: 8, gap: 1.1 }, { type: 'wisp', count: 18, gap: 0.45 }],
  [{ type: 'brute', count: 10, gap: 0.9 }, { type: 'shade', count: 18, gap: 0.6 }],
  [{ type: 'boss', count: 1, gap: 1.0 }, { type: 'brute', count: 6, gap: 1.2 }, { type: 'shade', count: 12, gap: 0.7 }],
];

export const START_EMBERS = 120;
export const LANTERN_HP = 20;
export const WAVE_CLEAR_BONUS = 25;
export const KILL_SCORE = 10;
