import type * as React from "react";

// Drop shadow colour: black at high opacity, kept tight rather than soft.
// Byte-for-byte what SquareGrid.tsx inlined before this seam existed.
const SHADOW_COLOR = "color-mix(in srgb, black 65%, transparent)";

// Bottom edge of a raised tile: the fill, always darker. Browsers without
// relative colour syntax drop the declaration and the tile is simply flat.
const EDGE_LIGHTNESS_STEP = 0.12;
function edgeColor(fill: string): string {
  return `oklch(from ${fill} calc(l - ${EDGE_LIGHTNESS_STEP}) c h)`;
}

export interface TileDepthStyle {
  style?: React.CSSProperties;
}

/**
 * Web half: the exact CSS the tile's `box-shadow` layers were built from
 * before this seam existed, passed through the `--bobuttons-tile-shadow`
 * custom property (Tamagui parses `boxShadow` itself and rejects modern
 * colour syntax — see BobuttonsProvider's injected `[data-bobuttons-tile]`
 * rule, which reads this property).
 */
export function tileDepthStyle(
  toCss: (color: string) => string,
  fill: string,
  depth: number,
  shadowOffset: number,
  shadowBlur: number,
  raised: boolean,
  shadow: boolean
): TileDepthStyle {
  const layers: string[] = [];
  if (raised) layers.push(`0 ${depth}px 0 ${edgeColor(toCss(fill))}`);
  if (shadow) layers.push(`0 ${shadowOffset}px ${shadowBlur}px ${SHADOW_COLOR}`);
  return layers.length ? { style: { "--bobuttons-tile-shadow": layers.join(", ") } as React.CSSProperties } : {};
}
