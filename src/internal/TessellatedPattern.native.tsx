import * as React from "react";
import { View, type LayoutChangeEvent } from "react-native";
import type { TessellatedIcon } from "../components/game/TessellatedBackground/TessellatedBackground.js";
import { wrapOffsets, type Placement } from "./tessellate.js";

export interface TessellatedPatternProps {
  placements: readonly Placement[];
  icons: ReadonlyArray<TessellatedIcon>;
  tileSize: number;
  /** Web-only: the SVG `<pattern>` element id. Unused on native. */
  patternId?: string;
  color: string;
  opacity: number;
}

/**
 * Native half: there is no CSS `<pattern>` tile-repeat on native, so the
 * laid-out tile (from the same platform-neutral `tessellate.ts` the web
 * half uses) is replicated across an explicitly measured area instead.
 * B2-AC13 first frame: renders no pattern — just the sized container —
 * until the first `onLayout`, then the full pattern at full opacity;
 * guessing a size first would cause a visible re-layout once the real size
 * arrived, which is the flicker this ticket's first-frame rule forbids.
 *
 * Renders `rows * columns * icons-per-tile` views, which is more views than
 * the web half's one repeated CSS tile costs. Fine for the tile/icon counts
 * this component's own docs recommend (3-8 icons, 1-3 copies each); flagged
 * here rather than hidden if a consumer tiles a very large area densely.
 */
export function TessellatedPattern(props: TessellatedPatternProps): React.ReactElement {
  const { placements, icons, tileSize, color, opacity } = props;
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const tileContent = React.useMemo(() => {
    const nodes: React.ReactElement[] = [];
    for (const p of placements) {
      const icon = icons[p.icon];
      if (!icon) continue;
      const { source: Source, size: iconSize } = icon;
      for (const [ox, oy] of wrapOffsets(p.x, p.y, iconSize, tileSize)) {
        const left = p.x + ox - iconSize / 2;
        const top = p.y + oy - iconSize / 2;
        nodes.push(
          <View
            key={`${p.icon}:${p.x}:${p.y}:${ox}:${oy}`}
            style={{ position: "absolute", left, top, transform: [{ rotate: `${p.rotation}deg` }] }}
          >
            <Source size={iconSize} color={color} />
          </View>
        );
      }
    }
    return nodes;
  }, [placements, icons, tileSize, color]);

  const tiles = React.useMemo(() => {
    if (!size) return null;
    const columns = Math.ceil(size.width / tileSize) + 1;
    const rows = Math.ceil(size.height / tileSize) + 1;
    const out: React.ReactElement[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        out.push(
          <View
            key={`${row}:${col}`}
            style={{ position: "absolute", left: col * tileSize, top: row * tileSize, width: tileSize, height: tileSize }}
          >
            {tileContent}
          </View>
        );
      }
    }
    return out;
  }, [size, tileSize, tileContent]);

  return (
    <View
      onLayout={onLayout}
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity }}
    >
      {tiles}
    </View>
  );
}
