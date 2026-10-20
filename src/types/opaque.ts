// Opaque public types for values whose real shape comes from @tamagui/*
// internals, which must never appear in Bobuttons' public .d.ts (docs/context
// §C1 / finding F1). This file has zero imports so it can never pull a
// @tamagui/* reference into the printed declaration of anything typed with
// it. Never constructed directly — only reached via an explicit
// `as unknown as X` cast at the point where a real Tamagui-typed value is
// re-exported from src/index.ts.
export interface BobuttonsTamaguiConfig {
  readonly __bobuttonsTamaguiConfigBrand: true;
}
