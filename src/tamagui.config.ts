import { createTamagui, createTokens, createFont } from "@tamagui/core";
import { themeNames, themes, type BobuttonsThemeName } from "./themes/themes.generated.js";
import { fontWeights } from "./tokens/fontWeights.js";

export { fontWeights };
export type { BobuttonsFontWeightName } from "./tokens/fontWeights.js";

export type { BobuttonsThemeName };
export { themeNames };

// AC7: --radius is declared exactly once, at themes.css:25, inside :root, and
// no theme overrides it (docs/context §A1) — so it is a config-level token,
// not a theme token, and lives here rather than in themes.generated.ts.
// Note: Tamagui reserves a `true` key on every token scale for
// component-driven defaults, so none of radius/space/size/zIndex below may
// declare one (verified at runtime: "tokens.<scale>.true is reserved because
// boolean values select component defaults"). --radius: 12px (themes.css:25)
// is instead the named step `$5`; components reference it explicitly as
// `$5` rather than `$true`.
const radius = {
  0: 0,
  1: 4,
  2: 6,
  3: 8,
  4: 10,
  5: 12, // --radius: 12px (themes.css:25)
  6: 16,
  7: 20,
} as const;

// Space/size scales: a conventional geometric-ish ramp seeded at the radius
// token. No raw px literal appears outside this file (AC7 / lint rule
// no-raw-style-literals).
const space = {
  0: 0,
  0.25: 1, // hairline border width (Button, Card, etc.)
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
} as const;

const size = {
  ...space,
} as const;

// docs/context §A5: measured across both apps, the complete z-index set is
// 1 (x3), 20 (x1), 1000 (x1) — 1000 is the meeting-alert overlay. (`true` is
// reserved by Tamagui for component defaults, same as radius above.)
const zIndex = {
  0: 0,
  1: 1,
  2: 20,
  3: 1000,
} as const;

const tokens = createTokens({
  color: {}, // colour tokens are per-theme (themes.generated.ts), not global
  radius,
  zIndex,
  space,
  size,
});

// AC7 / docs/context §N8: GenericFont types `size` as total but
// `lineHeight`/`letterSpacing`/`weight`/`style` as Partial<>, so a font with a
// hole in one of those constructs and renders with no error. BobuttonsFontSizeKey
// fixes one union, shared by both families, and every scale below is written
// as a total map over it so a missing step is a compile error at
// config-authoring time (re-asserted at runtime by scripts/check-themes.mjs).
//
// Measured font-size steps (docs/context §F2): the real set used by both
// source apps is 8-36px across 18 steps, not AC7's approximate 9-22px —
// 8px is .status-badge (StatusBadge) and 36px is .empty-icon (EmptyState),
// both inventory components, and raw px is lint-forbidden outside this file.
// Human decision at plan approval: ship the full 8-36px range.
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

// Line heights are a documented derivation, not a transcription (the source
// CSS declares no line-height for most sizes): round(size * 1.4) for body,
// round(size * 1.45) for mono. Recorded in docs/api/token-mapping.md.
function buildLineHeights(multiplier: number): Record<BobuttonsFontSizeKey, number> {
  const result = {} as Record<BobuttonsFontSizeKey, number>;
  for (const key of FONT_SIZE_KEYS) {
    result[key] = Math.round(FONT_SIZE_PX[key] * multiplier);
  }
  return result;
}

// Measured weights (docs/context §A5): 300, 400, 450, 500, 600, 700, 800.
//
// A per-font-size weight map (Tamagui's `font.weight`, keyed identically to
// `font.size`) was considered and rejected: grepping both source apps' CSS
// shows no functional correlation between size and weight — 11px alone
// appears at weight 500 (shell.css:52), 600 (detail.css:221) and 700
// (detail.css:33) in different selectors. Forcing a size->weight function
// would invent a correlation the source data does not have, which AC4's
// "any deviation ... is a defect" spirit also rules out for tokens generally.
// Every per-step entry below therefore stays the CSS default, 400, and the
// measured set is instead exposed as the named `fontWeights` constants below
// (docs/api/token-mapping.md "Font weight"), which components import and
// pass as `fontWeight={fontWeights.bold}` — a config-file-only numeric
// constant, not a raw literal in component source (AC7).
function buildWeights(): Record<BobuttonsFontSizeKey, string> {
  const result = {} as Record<BobuttonsFontSizeKey, string>;
  for (const key of FONT_SIZE_KEYS) {
    result[key] = "400";
  }
  return result;
}

// Named weight tokens: see src/tokens/fontWeights.ts, imported above and
// re-exported here so component source can `import { fontWeights } from
// "../../../tamagui.config.js"` OR from the public entry; both resolve to
// the same object. The only place these seven numbers are allowed to appear
// as literals is src/tokens/fontWeights.ts.

function buildLetterSpacing(): Record<BobuttonsFontSizeKey, number> {
  const result = {} as Record<BobuttonsFontSizeKey, number>;
  for (const key of FONT_SIZE_KEYS) {
    result[key] = 0;
  }
  return result;
}

// Tamagui also expects a `true` default-size key by convention (docs/context
// §N8: "a token scale with no true key is accepted; include true anyway").
// It is appended outside the strict per-step Record so BobuttonsFontSizeKey
// itself stays a clean 18-step numeric union shared by both families.
const DEFAULT_SIZE_KEY: BobuttonsFontSizeKey = 11; // 14px

const bodyFont = createFont({
  family:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  size: { ...FONT_SIZE_PX, true: FONT_SIZE_PX[DEFAULT_SIZE_KEY] },
  lineHeight: { ...buildLineHeights(1.4), true: Math.round(FONT_SIZE_PX[DEFAULT_SIZE_KEY] * 1.4) },
  weight: { ...buildWeights(), true: "400" },
  letterSpacing: { ...buildLetterSpacing(), true: 0 },
});

const monoFont = createFont({
  family: 'Menlo, Monaco, Consolas, "SF Mono", "Fira Code", monospace',
  size: { ...FONT_SIZE_PX, true: FONT_SIZE_PX[DEFAULT_SIZE_KEY] },
  lineHeight: { ...buildLineHeights(1.45), true: Math.round(FONT_SIZE_PX[DEFAULT_SIZE_KEY] * 1.45) },
  weight: { ...buildWeights(), true: "400" },
  letterSpacing: { ...buildLetterSpacing(), true: 0 },
});

// AC3/AC9: nine themes, each a flattened token set from themes.generated.ts.
// Tamagui's `theme_<name>` naming convention is used here; BobuttonsProvider
// (src/provider/BobuttonsProvider.tsx) maps the public `BobuttonsThemeName`
// 1:1 onto these.
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
});

export type BobuttonsConfig = typeof bobuttonsConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends BobuttonsConfig {}
}
