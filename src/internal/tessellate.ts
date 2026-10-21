export interface Placement {
  /** Index into the icon list. */
  icon: number;
  /** Centre of the icon within the tile. */
  x: number;
  y: number;
  /** Degrees. */
  rotation: number;
}

export interface TessellateOptions {
  seed: number;
  /** Edge length of the square tile. */
  tileSize: number;
  /** How many times each icon appears per tile. */
  copies: number;
  /** Maximum rotation either way, in degrees. */
  tilt: number;
}

// Small seeded PRNG, so the same seed always gives the same pattern.
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Padding around each icon, as a fraction of its size, so rotated corners clear their neighbours.
const RADIUS_FACTOR = 0.6;
const CANDIDATES = 40;

function wrappedDistance(a: number, b: number, tile: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, tile - d);
}

/**
 * Places `copies` of each icon in a tile that repeats seamlessly. Distances
 * wrap around the tile edges, and each icon goes where it clears the already
 * placed ones by the most (best-candidate sampling), largest icons first. If
 * the tile is too small for everything, icons end up as far apart as they can.
 */
export function layoutTile(sizes: ReadonlyArray<number>, options: TessellateOptions): Placement[] {
  const { seed, tileSize, copies, tilt } = options;
  const random = mulberry32(seed);

  const order = sizes
    .map((size, icon) => ({ size, icon }))
    .sort((a, b) => b.size - a.size || a.icon - b.icon)
    .flatMap(({ size, icon }) => Array.from({ length: copies }, () => ({ size, icon })));

  const placed: Array<Placement & { radius: number }> = [];
  for (const { size, icon } of order) {
    const radius = size * RADIUS_FACTOR;
    let best = { x: random() * tileSize, y: random() * tileSize, clearance: -Infinity };

    for (let i = 0; i < CANDIDATES; i++) {
      const x = random() * tileSize;
      const y = random() * tileSize;
      let clearance = Infinity;
      for (const other of placed) {
        const dx = wrappedDistance(x, other.x, tileSize);
        const dy = wrappedDistance(y, other.y, tileSize);
        clearance = Math.min(clearance, Math.hypot(dx, dy) - (radius + other.radius));
      }
      if (clearance > best.clearance) best = { x, y, clearance };
    }

    placed.push({ icon, x: best.x, y: best.y, rotation: (random() * 2 - 1) * tilt, radius });
  }

  return placed.map(({ icon, x, y, rotation }) => ({ icon, x, y, rotation }));
}

/**
 * Offsets at which an icon at (x, y) must also be drawn so the part that
 * crosses a tile edge reappears on the opposite side.
 */
export function wrapOffsets(x: number, y: number, size: number, tile: number): Array<[number, number]> {
  const reach = size * RADIUS_FACTOR + size * 0.1;
  const offsets: Array<[number, number]> = [];
  for (const ox of [-tile, 0, tile]) {
    for (const oy of [-tile, 0, tile]) {
      const overlapsX = x + ox + reach > 0 && x + ox - reach < tile;
      const overlapsY = y + oy + reach > 0 && y + oy - reach < tile;
      if (overlapsX && overlapsY) offsets.push([ox, oy]);
    }
  }
  return offsets;
}
