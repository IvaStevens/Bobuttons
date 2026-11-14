import * as React from "react";
import { VIEW_BOX, DEFAULT_SIZE, STROKE_WIDTH, STROKE_LINECAP, STROKE_LINEJOIN } from "./paint.js";
import { resolveStroke } from "./stroke.js";
import type { GlyphShape, PackIconProps } from "./types.js";

// WHY THIS RENDERER IS DUPLICATED PER PACK, NOT SHARED FROM A SINGLE MODULE:
// this file is copied (not imported across a subpath) into each of the four
// pack entry points' own bundle because two binding guarantees depend on
// each pack subpath being an independent module graph:
//   1. per-pack isolation — a consumer who imports only `bobuttons/icons/
//      shapes` must ship only shapes' glyph data, on web AND on native
//      (Metro). A shared `src/icons/Glyph.js` chunk reachable from all four
//      subpaths would still satisfy that (one shared chunk is not the same
//      as leaking another pack's DATA), but a future "helpful" refactor that
//      hoists this renderer into something reachable from `src/index.ts`
//      would silently break isolation by making icons/* reachable from the
//      root entry, which the opt-in design (B2-AC21's narrowed allowlist)
//      forbids.
//   2. byte identity — `dist/index.mjs`/`dist/index.cjs`/`dist/index.native.js`
//      must stay byte-for-byte what they were before this ticket. Nothing
//      under `src/icons/**` may be reachable from `src/index.ts` (enforced
//      by `scripts/check-icon-packs.mjs`'s two-way source-isolation check);
//      duplicating this small renderer per pack, rather than factoring it
//      into something the root entry could end up importing, is what keeps
//      that edge from ever existing.
// Do not "de-duplicate" this into a shared module imported by the root
// entry, or into a module imported from outside src/icons/**. If this
// renderer or the colour seam ever needs sharing beyond src/icons/**, that
// is a new decision, not a refactor.
//
// Every emitted element carries an INLINE STYLE with `fill: "none"` and the
// resolved stroke, not presentation attributes: `BobuttonsProvider.tsx`
// injects `[data-bobuttons-icon] svg path { fill: currentColor; }` for
// griddy-icons, and `Icon.tsx` applies `data-bobuttons-icon` to every icon it
// wraps, including a pack icon. A `fill="none"` attribute would lose to that
// author rule on `path` elements and would never even be reached by its
// selector on `circle`/`rect`/`ellipse`. An inline style wins over any
// stylesheet rule regardless of selector specificity, so this is immune to
// that rule (and to any future author rule shaped like it).
export function renderGlyph(shape: GlyphShape, props: PackIconProps): React.ReactElement {
  const { size = DEFAULT_SIZE, color } = props;
  const stroke = resolveStroke(color);
  const style = { fill: "none", stroke } as const;
  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEW_BOX}
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap={STROKE_LINECAP}
      strokeLinejoin={STROKE_LINEJOIN}
      aria-hidden="true"
    >
      {shape.map(([Tag, attrs], index) => (
        <Tag key={index} {...attrs} style={style} />
      ))}
    </svg>
  );
}
