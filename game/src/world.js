// Lantern Keep — the world: grid, the shadow path, build plots, the Great Lantern.
import { COLS, ROWS, CELL, PATH_CELLS, LANTERN_CELL, LANTERN_HP } from './config.js';

export function cellCenter(col, row) {
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
}

export function createWorld() {
  // Set of "col,row" keys that are path tiles (not buildable).
  const pathSet = new Set(PATH_CELLS.map(([c, r]) => `${c},${r}`));
  const lanternKey = `${LANTERN_CELL[0]},${LANTERN_CELL[1]}`;
  const pathPx = PATH_CELLS.map(([c, r]) => cellCenter(c, r));
  // The lantern sits at the end of the path.
  const lanternPos = cellCenter(LANTERN_CELL[0], LANTERN_CELL[1]);
  pathPx.push(lanternPos);

  return {
    pathSet,
    lanternKey,
    pathPx,
    lanternPos,
    lanternHp: LANTERN_HP,
    lanternMaxHp: LANTERN_HP,

    isPath(col, row) {
      return pathSet.has(`${col},${row}`);
    },
    isLantern(col, row) {
      return `${col},${row}` === lanternKey;
    },
    isBuildable(col, row) {
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
      return !this.isPath(col, row) && !this.isLantern(col, row);
    },
  };
}
