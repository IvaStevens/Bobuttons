import * as React from "react";
// Named import, not the package's default export: under moduleResolution
// "node16", react-native-svg's re-exported default (index.d.ts ->
// ReactNativeSVG.d.ts -> elements.d.ts) resolves to the whole module
// namespace instead of the `Svg` class, which tsc then rejects as a JSX
// component (TS2604/TS2786) — measured against this toolchain; the named
// export resolves correctly under both "bundler" and "node16".
import { Svg, Path, Circle, Rect, Ellipse } from "react-native-svg";
import { VIEW_BOX, DEFAULT_SIZE, STROKE_WIDTH, STROKE_LINECAP, STROKE_LINEJOIN } from "./paint.js";
import { resolveStroke } from "./stroke.native.js";
import type { GlyphShape, PackIconProps, GlyphTag } from "./types.js";

// See Glyph.tsx's header comment for why this renderer is a duplicated
// per-pack copy rather than a shared module: the same isolation and
// byte-identity guarantees apply here, and a `react-native-svg` import must
// never become reachable from `src/index.ts` or from outside `src/icons/**`
// (it would pull a peer the web/Electron build does not need into the one
// shared declaration emit).
const TAGS: Record<GlyphTag, typeof Path | typeof Circle | typeof Rect | typeof Ellipse> = {
  path: Path,
  circle: Circle,
  rect: Rect,
  ellipse: Ellipse,
};

export function renderGlyph(shape: GlyphShape, props: PackIconProps): React.ReactElement {
  const { size = DEFAULT_SIZE, color } = props;
  const stroke = resolveStroke(color);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={VIEW_BOX}
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap={STROKE_LINECAP}
      strokeLinejoin={STROKE_LINEJOIN}
    >
      {shape.map(([tag, attrs], index) => {
        const Tag = TAGS[tag];
        return <Tag key={index} {...attrs} fill="none" stroke={stroke} />;
      })}
    </Svg>
  );
}
