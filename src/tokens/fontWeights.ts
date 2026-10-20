// Named weight tokens for AC7 (docs/api/token-mapping.md "Font weight").
//
// This is a standalone, @tamagui/*-free module (no import from
// tamagui.config.ts) so it can be re-exported from both tamagui.config.ts
// (which defines the Tamagui font config) and src/index.ts (the public
// entry) without ever forcing a consumer's type-checker to resolve
// tamagui.config.d.ts, which transitively references @tamagui/web and is
// not resolvable outside this repo (review finding, high — see src/index.ts
// for the full explanation).
//
// Measured weight set (docs/context §A5): 300, 400, 450, 500, 600, 700, 800.
// A per-font-size weight map was considered and rejected — see the comment
// above `buildWeights()` in tamagui.config.ts — because the source apps show
// no functional correlation between size and weight.
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 450,
  mediumPlus: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
} as const;

export type BobuttonsFontWeightName = keyof typeof fontWeights;
