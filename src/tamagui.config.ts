import { createTamagui, createTokens, createFont } from "@tamagui/core";
import { palette, themeNames, themes, type BobuttonsThemeName } from "./themes/themes.generated.js";
import { breakpoints } from "./tokens/breakpoints.js";
import { fontWeights } from "./tokens/fontWeights.js";
import { space } from "./tokens/space.js";
import { fontFamilies } from "./tokens/fontFamilies.js";

export { fontWeights, breakpoints };
export type { BobuttonsFontWeightName } from "./tokens/fontWeights.js";

export type { BobuttonsThemeName };
export { themeNames };

// --radius is declared once in :root and no theme overrides it, so it is a
// config-level token rather than a theme token. Tamagui reserves a `true` key
// on token scales, so none of these may declare one; `--radius: 12px` is `$5`.
const radius = {
  0: 0,
  1: 4,
  2: 6,
  3: 8,
  4: 10,
  5: 12,
  6: 16,
  7: 20,
} as const;

// Raw px literals are only allowed in this file and src/tokens/** (see
// no-raw-style-literals). `space` is sourced from src/tokens/space.ts — the
// one place its values are written — so Scroll.native.tsx and any other
// native seam that can't resolve a Tamagui token directly shares the exact
// same numbers (B2-AC14: one token source, no second native-only one).
const size = {
  ...space,
} as const;

// The complete z-index set used by the source apps; 1000 is the meeting-alert
// overlay.
const zIndex = {
  0: 0,
  1: 1,
  2: 20,
  3: 1000,
} as const;

const tokens = createTokens({
  color: palette, // the named palette: theme-independent. Semantic colours are per-theme (themes.generated.ts)
  radius,
  zIndex,
  space,
  size,
});

// GenericFont types only `size` as total, so a font with a hole in
// `lineHeight`/`letterSpacing`/`weight` would build without error. Every scale
// below is a total map over this key union, so a missing step fails to
// compile (scripts/check-themes.mjs re-checks at runtime). The 18 steps cover
// the full 8-36px range used by the source apps.
export type BobuttonsFontSizeKey =
  | 1 // 8
  | 2 // 9
  | 3 // 10
  | 4 // 10.5
  | 5 // 11
  | 6 // 11.5
  | 7 // 12
  | 8 // 12.5
  | 9 // 13
  | 10 // 13.5
  | 11 // 14
  | 12 // 15
  | 13 // 16
  | 14 // 17
  | 15 // 18
  | 16 // 20
  | 17 // 22
  | 18; // 36

const FONT_SIZE_KEYS: readonly BobuttonsFontSizeKey[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
];

const FONT_SIZE_PX: Record<BobuttonsFontSizeKey, number> = {
  1: 8,
  2: 9,
  3: 10,
  4: 10.5,
  5: 11,
  6: 11.5,
  7: 12,
  8: 12.5,
  9: 13,
  10: 13.5,
  11: 14,
  12: 15,
  13: 16,
  14: 17,
  15: 18,
  16: 20,
  17: 22,
  18: 36,
};

// Derived, not transcribed (the source CSS rarely sets line-height): the size
// times 1.4 for body and 1.45 for mono, rounded.
function buildLineHeights(multiplier: number): Record<BobuttonsFontSizeKey, number> {
  const result = {} as Record<BobuttonsFontSizeKey, number>;
  for (const key of FONT_SIZE_KEYS) {
    result[key] = Math.round(FONT_SIZE_PX[key] * multiplier);
  }
  return result;
}

// Size and weight don't correlate in the source CSS, so every per-step weight
// stays 400; the measured weights are exposed as named `fontWeights` instead.
function buildWeights(): Record<BobuttonsFontSizeKey, string> {
  const result = {} as Record<BobuttonsFontSizeKey, string>;
  for (const key of FONT_SIZE_KEYS) {
    result[key] = "400";
  }
  return result;
}

function buildLetterSpacing(): Record<BobuttonsFontSizeKey, number> {
  const result = {} as Record<BobuttonsFontSizeKey, number>;
  for (const key of FONT_SIZE_KEYS) {
    result[key] = 0;
  }
  return result;
}

// The `true` default-size key is appended outside the per-step Record so the
// key union stays a clean 18 steps.
const DEFAULT_SIZE_KEY: BobuttonsFontSizeKey = 11; // 14px

const bodyFont = createFont({
  family: fontFamilies.body,
  size: { ...FONT_SIZE_PX, true: FONT_SIZE_PX[DEFAULT_SIZE_KEY] },
  lineHeight: { ...buildLineHeights(1.4), true: Math.round(FONT_SIZE_PX[DEFAULT_SIZE_KEY] * 1.4) },
  weight: { ...buildWeights(), true: "400" },
  letterSpacing: { ...buildLetterSpacing(), true: 0 },
});

const monoFont = createFont({
  family: fontFamilies.mono,
  size: { ...FONT_SIZE_PX, true: FONT_SIZE_PX[DEFAULT_SIZE_KEY] },
  lineHeight: { ...buildLineHeights(1.45), true: Math.round(FONT_SIZE_PX[DEFAULT_SIZE_KEY] * 1.45) },
  weight: { ...buildWeights(), true: "400" },
  letterSpacing: { ...buildLetterSpacing(), true: 0 },
});

// Nine themes, each a flattened token set from themes.generated.ts.
const tamaguiThemes = Object.fromEntries(
  themeNames.map((name) => [name, themes[name]])
) as Record<BobuttonsThemeName, (typeof themes)[BobuttonsThemeName]>;

export const bobuttonsConfig = createTamagui({
  themes: tamaguiThemes,
  tokens,
  fonts: {
    body: bodyFont,
    mono: monoFont,
    heading: bodyFont,
  },
  defaultFont: "body",
  shorthands: {},
  // Declared in increasing priority: `mobile` overrides `tablet` where both match.
  media: {
    tablet: { maxWidth: breakpoints.tablet },
    mobile: { maxWidth: breakpoints.mobile },
  },
});

export type BobuttonsConfig = typeof bobuttonsConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends BobuttonsConfig {}
}
