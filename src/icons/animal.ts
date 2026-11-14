// Pack entry for "animal" (bobuttons/icons/animal). Opt-in: nothing here is
// reachable from src/index.ts (see scripts/check-icon-packs.mjs's two-way
// source-isolation check). Export convention (decision B): one PascalCase
// component per lucide name, a quoted-key record for programmatic lookup,
// and this pack's name-union type, which is the compile-time half of the
// unknown-name contract — an unknown string indexes to `undefined` at
// runtime (see src/icons/packs.test.tsx and the README).
import * as React from "react";
import { renderGlyph } from "./Glyph.js";
import { animalGlyphs } from "./glyphs/animal.generated.js";
import type { PackIconProps } from "./types.js";

export function Cat(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["cat"], props);
}

export function Dog(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["dog"], props);
}

export function Rabbit(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["rabbit"], props);
}

export function Squirrel(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["squirrel"], props);
}

export function Feather(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["feather"], props);
}

export function PawPrint(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["paw-print"], props);
}

export function Bird(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["bird"], props);
}

export function Fish(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["fish"], props);
}

export function Panda(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["panda"], props);
}

export function Snail(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["snail"], props);
}

export function Shrimp(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["shrimp"], props);
}

export function Rat(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["rat"], props);
}

export function Birdhouse(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["birdhouse"], props);
}

export function Bone(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["bone"], props);
}

export function Turtle(props: PackIconProps): React.ReactElement {
  return renderGlyph(animalGlyphs["turtle"], props);
}

/** Every icon in the "animal" pack, keyed by its lucide name. */
export const animalIcons = {
  "cat": Cat,
  "dog": Dog,
  "rabbit": Rabbit,
  "squirrel": Squirrel,
  "feather": Feather,
  "paw-print": PawPrint,
  "bird": Bird,
  "fish": Fish,
  "panda": Panda,
  "snail": Snail,
  "shrimp": Shrimp,
  "rat": Rat,
  "birdhouse": Birdhouse,
  "bone": Bone,
  "turtle": Turtle,
} as const;

/** The literal name union — importing this is the compile-time half of the unknown-name contract (see README). */
export type AnimalIconName = keyof typeof animalIcons;
