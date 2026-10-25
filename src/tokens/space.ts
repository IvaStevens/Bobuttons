// The `space` token scale, extracted unchanged from tamagui.config.ts so the
// native-only seams that cannot use Tamagui's styling engine directly (e.g.
// Scroll.native.tsx's ScrollView, which Tamagui does not style) can resolve
// a "$token" to the same raw pixel number tamagui.config.ts gives Tamagui,
// with no second native-only token source (B2-AC14). @tamagui-free, like
// fontWeights.ts and breakpoints.ts, so it can be imported from
// src/internal/** without pulling @tamagui/core's types into those files.
export const space = {
  0: 0,
  0.25: 1, // hairline border
  0.5: 2,
  0.75: 3,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  headerHeight: 38,
  sidebarWidth: 80,
  bodyBottomInset: 72,
  inputWidth: 200,
  inputWidthCompact: 72,
  swatch: 13,
} as const;

export type BobuttonsSpaceKey = keyof typeof space;
