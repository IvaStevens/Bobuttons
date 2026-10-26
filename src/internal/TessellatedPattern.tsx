import * as React from "react";
import type { TessellatedIcon } from "../components/game/TessellatedBackground/TessellatedBackground.js";
import { wrapOffsets, type Placement } from "./tessellate.js";

export interface TessellatedPatternProps {
  placements: readonly Placement[];
  icons: ReadonlyArray<TessellatedIcon>;
  tileSize: number;
  patternId: string;
  color: string;
  opacity: number;
}

/**
 * Web half: today's `<svg><defs><pattern>` tiling, extracted from
 * TessellatedBackground.tsx unchanged (B2-AC11). The browser repeats the
 * single laid-out tile, which costs far less than a full-size image.
 */
export function TessellatedPattern(props: TessellatedPatternProps): React.ReactElement {
  const { placements, icons, tileSize, patternId, color, opacity } = props;

  const tiles = placements.flatMap((p, i) => {
    const icon = icons[p.icon];
    if (!icon) return [];
    const { source: Source, size } = icon;
    return wrapOffsets(p.x, p.y, size, tileSize).map(([ox, oy]) => (
      <g
        key={`${i}:${ox}:${oy}`}
        transform={`translate(${p.x + ox - size / 2} ${p.y + oy - size / 2}) rotate(${p.rotation} ${size / 2} ${size / 2})`}
      >
        <Source size={size} color="currentColor" />
      </g>
    ));
  });

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-bobuttons-pattern=""
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        color,
        opacity,
      }}
    >
      <defs>
        <pattern id={patternId} width={tileSize} height={tileSize} patternUnits="userSpaceOnUse">
          <g data-bobuttons-icon="">{tiles}</g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
