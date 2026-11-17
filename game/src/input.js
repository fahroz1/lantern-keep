// Lantern Keep — input: mouse (click/hover, canvas-scaled) and keyboard.
// The canvas is scaled to fit the window; this maps client coords to game coords.

export function createInput(canvas, scale) {
  const input = {
    mouseX: -1,
    mouseY: -1,
    mouseCell: null, // {col,row} or null
    clickedCell: null, // consumed by main loop
    clickedPos: null, // {x,y} game coords, consumed by main loop
    keys: {},
    pressed: {}, // edge-triggered, consumed by main loop
  };

  function toGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (scale.viewW / rect.width);
    const y = (clientY - rect.top) * (scale.viewH / rect.height);
    return { x, y };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = toGame(e.clientX, e.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
    const col = Math.floor(p.x / scale.cell);
    const row = Math.floor(p.y / scale.cell);
    input.mouseCell =
      col >= 0 && col < scale.cols && row >= 0 && row < scale.rows ? { col, row } : null;
  });

  canvas.addEventListener('mouseleave', () => {
    input.mouseX = -1;
    input.mouseY = -1;
    input.mouseCell = null;
  });

  canvas.addEventListener('mousedown', (e) => {
    const p = toGame(e.clientX, e.clientY);
    input.clickedPos = p;
    const col = Math.floor(p.x / scale.cell);
    const row = Math.floor(p.y / scale.cell);
    input.clickedCell =
      col >= 0 && col < scale.cols && row >= 0 && row < scale.rows ? { col, row } : null;
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    input.keys[k] = true;
    input.pressed[k] = true;
    if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  });

  window.addEventListener('keyup', (e) => {
    input.keys[e.key.toLowerCase()] = false;
  });

  input.consumeClick = () => {
    const c = input.clickedCell;
    const p = input.clickedPos;
    input.clickedCell = null;
    input.clickedPos = null;
    return { cell: c, pos: p };
  };

  input.wasPressed = (key) => {
    const v = !!input.pressed[key];
    input.pressed[key] = false;
    return v;
  };

  input.clearPressed = () => {
    input.pressed = {};
  };

  return input;
}
