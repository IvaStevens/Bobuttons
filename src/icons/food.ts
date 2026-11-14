// Pack entry for "food" (bobuttons/icons/food). Opt-in: nothing here is
// reachable from src/index.ts (see scripts/check-icon-packs.mjs's two-way
// source-isolation check). Export convention (decision B): one PascalCase
// component per lucide name, a quoted-key record for programmatic lookup,
// and this pack's name-union type, which is the compile-time half of the
// unknown-name contract — an unknown string indexes to `undefined` at
// runtime (see src/icons/packs.test.tsx and the README).
import * as React from "react";
import { renderGlyph } from "./Glyph.js";
import { foodGlyphs } from "./glyphs/food.generated.js";
import type { PackIconProps } from "./types.js";

export function Fish(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["fish"], props);
}

export function Utensils(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["utensils"], props);
}

export function Apple(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["apple"], props);
}

export function Beef(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["beef"], props);
}

export function Pizza(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["pizza"], props);
}

export function Carrot(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["carrot"], props);
}

export function Bean(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["bean"], props);
}

export function Cookie(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["cookie"], props);
}

export function IceCreamCone(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["ice-cream-cone"], props);
}

export function Soup(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["soup"], props);
}

export function Croissant(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["croissant"], props);
}

export function Nut(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["nut"], props);
}

export function Broccoli(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["broccoli"], props);
}

export function Cupcake(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["cupcake"], props);
}

export function Avocado(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["avocado"], props);
}

export function Shrimp(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["shrimp"], props);
}

export function Coffee(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["coffee"], props);
}

export function CupSoda(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["cup-soda"], props);
}

export function Milk(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["milk"], props);
}

export function Cheese(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["cheese"], props);
}

export function Citrus(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["citrus"], props);
}

export function Hamburger(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["hamburger"], props);
}

export function Bacon(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["bacon"], props);
}

export function Grape(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["grape"], props);
}

export function Cake(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["cake"], props);
}

export function Beer(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["beer"], props);
}

export function Wine(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["wine"], props);
}

export function Martini(props: PackIconProps): React.ReactElement {
  return renderGlyph(foodGlyphs["martini"], props);
}

/** Every icon in the "food" pack, keyed by its lucide name. */
export const foodIcons = {
  "fish": Fish,
  "utensils": Utensils,
  "apple": Apple,
  "beef": Beef,
  "pizza": Pizza,
  "carrot": Carrot,
  "bean": Bean,
  "cookie": Cookie,
  "ice-cream-cone": IceCreamCone,
  "soup": Soup,
  "croissant": Croissant,
  "nut": Nut,
  "broccoli": Broccoli,
  "cupcake": Cupcake,
  "avocado": Avocado,
  "shrimp": Shrimp,
  "coffee": Coffee,
  "cup-soda": CupSoda,
  "milk": Milk,
  "cheese": Cheese,
  "citrus": Citrus,
  "hamburger": Hamburger,
  "bacon": Bacon,
  "grape": Grape,
  "cake": Cake,
  "beer": Beer,
  "wine": Wine,
  "martini": Martini,
} as const;

/** The literal name union — importing this is the compile-time half of the unknown-name contract (see README). */
export type FoodIconName = keyof typeof foodIcons;
