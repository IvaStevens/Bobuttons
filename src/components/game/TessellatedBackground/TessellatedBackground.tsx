import * as React from "react";
import { styled, View } from "@tamagui/core";
import { useCssColor } from "../../../internal/cssColor.js";
import { layoutTile, wrapOffsets } from "../../../internal/tessellate.js";
import type { IconSource } from "../../primitives/Icon/Icon.js";
import type { SquareColor } from "../SquareGrid/SquareGrid.js";

// Fills its parent; the pattern sits behind the content.
const Frame = styled(View, {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
});

const Content = styled(View, {
  position: "relative",
  flex: 1,
  flexDirection: "column",
});

export interface TessellatedIcon {
  source: IconSource;
  /** Size in px. Fixed: the icon is this size everywhere it appears. */
  size: number;
}

export interface TessellatedBackgroundProps {
  /** The icons to tile. Intended for 3 to 8, of differing sizes. */
  icons: ReadonlyArray<TessellatedIcon>;
  /** Same seed, same pattern. Defaults to 1. */
  seed?: number;
  /** Edge length in px of the square tile that repeats. Defaults to 240. */
  tileSize?: number;
  /** How many times each icon appears per tile. Defaults to 2. */
  copies?: number;
  /** Maximum rotation of an icon either way, in degrees. Defaults to 20; 0 keeps them upright. */
  tilt?: number;
  /** Icon colour: a theme token ("$color") or any CSS colour. Defaults to "$color". */
  color?: SquareColor;
  /** Icon opacity, 0 to 1. Defaults to 0.12 so the pattern stays behind content. */
  opacity?: number;
  /** Content drawn over the pattern. */
  children?: React.ReactNode;
}

/**
 * A repeating pattern of icons behind its children. One tile is laid out once
 * (seeded, so it is deterministic) and the browser repeats it, which costs far
 * less than a full-size image and stays sharp and themeable.
 */
export function TessellatedBackground(props: TessellatedBackgroundProps): React.ReactElement {
  const { icons, seed = 1, tileSize = 240, copies = 2, tilt = 20, color = "$color", opacity = 0.12, children } = props;
  const toCss = useCssColor();
  const patternId = React.useId().replace(/:/g, "");

  // Only the sizes affect the layout, so an inline `icons` array doesn't re-lay-out each render.
  const sizesKey = icons.map((icon) => icon.size).join(",");
  const placements = React.useMemo(
    () => layoutTile(sizesKey ? sizesKey.split(",").map(Number) : [], { seed, tileSize, copies, tilt }),
    [sizesKey, seed, tileSize, copies, tilt],
  );

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
    <Frame>
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
          color: toCss(color),
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
      <Content>{children}</Content>
    </Frame>
  );
}
