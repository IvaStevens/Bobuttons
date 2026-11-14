// Local to src/icons/** on purpose: never import `IconSource` from the root
// entry (src/index.ts) here. Importing it would create a declaration edge
// from a pack's `.d.ts` back into `index.d.ts`, which is exactly the kind of
// cross-module coupling the opt-in design avoids (see the README note next
// to the pack exports and the rationale comment in Glyph.tsx). Structural
// assignability — `PackIconProps` happens to match `IconSource`'s prop shape
// — is what lets a pack icon drop into `Icon`'s `source` prop unchanged, and
// is what BOBUTTONS-3 can build its named icons on without a second
// mechanism.
import type * as React from "react";

/** One lucide-shaped SVG primitive: `["path", { d: "..." }]`, etc. */
export type GlyphTag = "path" | "circle" | "rect" | "ellipse";
export type GlyphNode = readonly [GlyphTag, Readonly<Record<string, string>>];
export type GlyphShape = readonly GlyphNode[];

export interface PackIconProps {
  /** Pixel size. Defaults to 24 (lucide's own default, see paint.ts). */
  size?: number | string;
  /** Stroke colour. Defaults to "currentColor" on web, "#000" on native. */
  color?: string;
}

/** Same shape as `Icon`'s `IconSource` — deliberately not imported from it. */
export type PackIcon = (props: PackIconProps) => React.ReactElement;
