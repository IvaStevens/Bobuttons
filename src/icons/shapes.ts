// Pack entry for "shapes" (bobuttons/icons/shapes). Opt-in: nothing here is
// reachable from src/index.ts (see scripts/check-icon-packs.mjs's two-way
// source-isolation check). Export convention (decision B): one PascalCase
// component per lucide name, a quoted-key record for programmatic lookup,
// and this pack's name-union type, which is the compile-time half of the
// unknown-name contract — an unknown string indexes to `undefined` at
// runtime (see src/icons/packs.test.tsx and the README).
import * as React from "react";
import { renderGlyph } from "./Glyph.js";
import { shapesGlyphs } from "./glyphs/shapes.generated.js";
import type { PackIconProps } from "./types.js";

export function Triangle(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["triangle"], props);
}

export function Diamond(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["diamond"], props);
}

export function Octagon(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["octagon"], props);
}

export function Astroid(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["astroid"], props);
}

export function Club(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["club"], props);
}

export function Circle(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["circle"], props);
}

export function Star(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["star"], props);
}

export function Heart(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["heart"], props);
}

export function Cross(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["cross"], props);
}

export function Pyramid(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["pyramid"], props);
}

export function Box(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["box"], props);
}

export function Cone(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["cone"], props);
}

export function Sparkle(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["sparkle"], props);
}

export function Boxes(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["boxes"], props);
}

export function Cylinder(props: PackIconProps): React.ReactElement {
  return renderGlyph(shapesGlyphs["cylinder"], props);
}

/** Every icon in the "shapes" pack, keyed by its lucide name. */
export const shapesIcons = {
  "triangle": Triangle,
  "diamond": Diamond,
  "octagon": Octagon,
  "astroid": Astroid,
  "club": Club,
  "circle": Circle,
  "star": Star,
  "heart": Heart,
  "cross": Cross,
  "pyramid": Pyramid,
  "box": Box,
  "cone": Cone,
  "sparkle": Sparkle,
  "boxes": Boxes,
  "cylinder": Cylinder,
} as const;

/** The literal name union — importing this is the compile-time half of the unknown-name contract (see README). */
export type ShapesIconName = keyof typeof shapesIcons;
