import * as React from "react";
import { TamaguiProvider, View } from "@tamagui/core";
import { bobuttonsConfig } from "../tamagui.config.js";
import type { BobuttonsThemeName } from "../themes/themes.generated.js";

export interface BobuttonsProviderProps {
  /** Defaults to "default" (the :root theme). */
  theme?: BobuttonsThemeName;
  children: React.ReactNode;
}

// The browser's own number spinner, with its box removed and its arrows redrawn
// as chevrons in theme colours. It stays the native control, so stepping,
// hold-to-repeat and keyboard behaviour are unchanged. A mask draws the arrows
// so their colour can come from a theme variable. Firefox doesn't let its spinner
// be styled, so there it is hidden instead (the input still steps with the
// arrow keys and mouse wheel).
const SPIN_CHEVRONS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 24'%3E%3Cpath d='M3.5 9 7 5.5 10.5 9M3.5 15 7 18.5 10.5 15' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") center / contain no-repeat";

// Rules no style prop can express, scoped to Bobuttons' own data attributes so
// no !important is needed. Many griddy-icons hardcode `<path fill="black">`,
// which no root <svg> prop can reach; placeholders and spinners need pseudo-elements.
const BASE_CSS = [
  "[data-bobuttons-icon] svg path { fill: currentColor; }",
  "[data-bobuttons-input]::placeholder { color: var(--textFaint); }",
  `[data-bobuttons-input]::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; opacity: 1; cursor: pointer; margin: 0; width: 1.1em; height: 2em; background-color: var(--textDim); -webkit-mask: ${SPIN_CHEVRONS}; mask: ${SPIN_CHEVRONS}; }`,
  "[data-bobuttons-input]::-webkit-inner-spin-button:hover { background-color: var(--color); }",
  '[data-bobuttons-input][type="number"] { -moz-appearance: textfield; }',
  // Tamagui parses `boxShadow` and rejects modern colour syntax, so tile
  // shadows are passed as a custom property.
  "[data-bobuttons-tile] { box-shadow: var(--bobuttons-tile-shadow, none); }",
].join("\n");

/**
 * Themes the whole document via `TamaguiProvider`. Deliberately no inner
 * `<Theme>` and no `key`: in the pinned @tamagui/core, `defaultTheme` is
 * re-applied on every render, so changing `theme` restyles the tree without
 * remounting. Adding a `key` would remount; see
 * BobuttonsProvider.remount.test.tsx. Recheck that test on any @tamagui/core
 * upgrade.
 *
 * Root-only: side-by-side themes need their own inner `<Theme name>`.
 *
 * The wrapping `View` paints `$background`, which `TamaguiProvider` doesn't,
 * so transparent variants (e.g. `ghost`) sit on the theme background.
 */
export function BobuttonsProvider(props: BobuttonsProviderProps): React.ReactElement {
  const { theme = "default", children } = props;
  return (
    <TamaguiProvider config={bobuttonsConfig} defaultTheme={theme}>
      <style data-bobuttons-style="" dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
      <View backgroundColor="$background" minHeight="100%">
        {children}
      </View>
    </TamaguiProvider>
  );
}
