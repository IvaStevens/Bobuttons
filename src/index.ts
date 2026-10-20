// AC10: the single public entry point. Every exported symbol here is the
// contract three future consumers depend on — adding is allowed, renaming is
// a breaking change. Every exported component carries a hand-written props
// interface and an explicit React.ReactElement return type (docs/context
// §C1); no styled() result or anything inferred from @tamagui/* is ever
// exported here (§F1) — that is what keeps the emitted .d.ts free of
// @tamagui/* references for the AC15 scratch consumer.
export { BobuttonsProvider } from "./provider/BobuttonsProvider.js";
export type { BobuttonsProviderProps } from "./provider/BobuttonsProvider.js";

// `bobuttonsConfig` is re-exported through an explicit opaque type
// (docs/context §C1): its real type comes from @tamagui/core's
// `createTamagui` return value, which must never be printed into this
// package's public .d.ts (finding F1) or the AC15 scratch consumer fails
// TS2307. The cast is load-bearing, not a shortcut.
import { bobuttonsConfig as _bobuttonsConfig } from "./tamagui.config.js";
import type { BobuttonsTamaguiConfig } from "./types/opaque.js";

export const bobuttonsConfig: BobuttonsTamaguiConfig = _bobuttonsConfig as unknown as BobuttonsTamaguiConfig;

// themeNames / BobuttonsThemeName are re-exported from the config-FREE
// themes.generated.js, never from tamagui.config.js (review finding, high):
// tamagui.config.ts's own emitted declaration (dist/tamagui.config.d.ts)
// necessarily types `bobuttonsConfig` from @tamagui/core's `createTamagui`
// return value, which transitively references `@tamagui/web`. Re-exporting
// a type *from that module* (even one as simple as `BobuttonsThemeName`)
// makes dist/index.d.ts import dist/tamagui.config.d.ts, which a consumer
// installed outside this repo cannot resolve (@tamagui/web is not even a
// declared dependency) — TS2307 under both bundler and node16. Sourcing both
// symbols from themes.generated.js instead keeps the public declaration
// graph free of any @tamagui/* reference.
export { themeNames } from "./themes/themes.generated.js";
export type { BobuttonsThemeName } from "./themes/themes.generated.js";
export type { BobuttonsTamaguiConfig } from "./types/opaque.js";

export { Button } from "./components/primitives/Button/Button.js";
export type { ButtonProps } from "./components/primitives/Button/Button.js";

// AC10 permits additions: `fontWeights` is the named-weight-token contract
// for AC7 (docs/api/token-mapping.md "Font weight"). Sourced from the
// standalone, @tamagui/*-free src/tokens/fontWeights.js — NOT re-exported
// from tamagui.config.js — for the same reason themeNames/BobuttonsThemeName
// above are not: a bare `export { x } from "./tamagui.config.js"` forces any
// consumer loading dist/index.d.ts to resolve dist/tamagui.config.d.ts too,
// which references @tamagui/web and is not resolvable outside this repo.
export { fontWeights } from "./tokens/fontWeights.js";
export type { BobuttonsFontWeightName } from "./tokens/fontWeights.js";
