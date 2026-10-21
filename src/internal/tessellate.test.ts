import { describe, expect, it } from "vitest";
import { layoutTile, wrapOffsets } from "./tessellate.js";

const sizes = [48, 36, 28, 22, 18];
const options = { seed: 7, tileSize: 360, copies: 2, tilt: 20 };

describe("layoutTile", () => {
  it("is deterministic for a seed and differs between seeds", () => {
    expect(layoutTile(sizes, options)).toEqual(layoutTile(sizes, options));
    expect(layoutTile(sizes, { ...options, seed: 8 })).not.toEqual(layoutTile(sizes, options));
  });

  it("places every icon the requested number of times, inside the tile", () => {
    const placements = layoutTile(sizes, options);
    expect(placements).toHaveLength(sizes.length * options.copies);
    for (let icon = 0; icon < sizes.length; icon++) {
      expect(placements.filter((p) => p.icon === icon)).toHaveLength(options.copies);
    }
    for (const p of placements) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(options.tileSize);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(options.tileSize);
      expect(Math.abs(p.rotation)).toBeLessThanOrEqual(options.tilt);
    }
  });

  it("keeps rotation at zero when tilt is zero", () => {
    expect(layoutTile(sizes, { ...options, tilt: 0 }).every((p) => p.rotation === 0)).toBe(true);
  });

  it("does not overlap icons, counting wrap-around, when the tile has room", () => {
    const placements = layoutTile(sizes, options);
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = placements[i]!;
        const b = placements[j]!;
        const dx = Math.min(Math.abs(a.x - b.x), options.tileSize - Math.abs(a.x - b.x));
        const dy = Math.min(Math.abs(a.y - b.y), options.tileSize - Math.abs(a.y - b.y));
        const minimum = (sizes[a.icon]! + sizes[b.icon]!) / 2;
        expect(Math.hypot(dx, dy)).toBeGreaterThan(minimum);
      }
    }
  });
});

describe("wrapOffsets", () => {
  it("draws an icon once when it is well inside the tile", () => {
    expect(wrapOffsets(180, 180, 40, 360)).toEqual([[0, 0]]);
  });

  it("repeats an icon across the edges it crosses", () => {
    expect(wrapOffsets(5, 180, 40, 360)).toHaveLength(2);
    expect(wrapOffsets(5, 5, 40, 360)).toHaveLength(4);
  });
});
