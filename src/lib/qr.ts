/**
 * Local, dependency-free QR-style matrix for the drop-off slip.
 * It is a deterministic visual code generated from the slip payload.
 * The verification code printed under it is the authoritative check.
 */
export function qrMatrix(payload: string, size = 25): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid[y][x] = rnd() > 0.52;
    }
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = edge || core;
      }
    }
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gx = ox + x;
        const gy = oy + y;
        if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue;
        if (x === -1 || y === -1 || x === 7 || y === 7) grid[gy][gx] = false;
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  return grid;
}

export function qrSvgPath(grid: boolean[][], module = 4) {
  let d = "";
  grid.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) d += `M${x * module} ${y * module}h${module}v${module}h-${module}z`;
    })
  );
  return d;
}
