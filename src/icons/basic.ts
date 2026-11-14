// Pack entry for "basic" (bobuttons/icons/basic). Opt-in: nothing here is
// reachable from src/index.ts (see scripts/check-icon-packs.mjs's two-way
// source-isolation check). Export convention (decision B): one PascalCase
// component per lucide name, a quoted-key record for programmatic lookup,
// and this pack's name-union type, which is the compile-time half of the
// unknown-name contract — an unknown string indexes to `undefined` at
// runtime (see src/icons/packs.test.tsx and the README).
import * as React from "react";
import { renderGlyph } from "./Glyph.js";
import { basicGlyphs } from "./glyphs/basic.generated.js";
import type { PackIconProps } from "./types.js";

export function Menu(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["menu"], props);
}

export function Ellipsis(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["ellipsis"], props);
}

export function ChevronRight(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["chevron-right"], props);
}

export function Calendar(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["calendar"], props);
}

export function Circle(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["circle"], props);
}

export function CircleCheck(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["circle-check"], props);
}

export function User(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["user"], props);
}

export function TriangleAlert(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["triangle-alert"], props);
}

export function Play(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["play"], props);
}

export function Pause(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["pause"], props);
}

export function Star(props: PackIconProps): React.ReactElement {
  return renderGlyph(basicGlyphs["star"], props);
}

/** Every icon in the "basic" pack, keyed by its lucide name. */
export const basicIcons = {
  "menu": Menu,
  "ellipsis": Ellipsis,
  "chevron-right": ChevronRight,
  "calendar": Calendar,
  "circle": Circle,
  "circle-check": CircleCheck,
  "user": User,
  "triangle-alert": TriangleAlert,
  "play": Play,
  "pause": Pause,
  "star": Star,
} as const;

/** The literal name union — importing this is the compile-time half of the unknown-name contract (see README). */
export type BasicIconName = keyof typeof basicIcons;
