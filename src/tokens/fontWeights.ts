// Standalone and @tamagui-free (no import from tamagui.config.ts) so it can be
// re-exported from the public entry without pulling tamagui.config.d.ts into
// consumers' type graph. See src/index.ts.
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
