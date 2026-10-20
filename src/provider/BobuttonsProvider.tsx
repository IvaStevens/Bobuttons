import * as React from "react";
import { TamaguiProvider, View } from "@tamagui/core";
import { bobuttonsConfig } from "../tamagui.config.js";
import type { BobuttonsThemeName } from "../themes/themes.generated.js";

export interface BobuttonsProviderProps {
  /** Defaults to "default" — the :root theme, promoted to a first-class,
   * selectable theme per AC3. */
  theme?: BobuttonsThemeName;
  children: React.ReactNode;
}

// The one hand-written CSS rule in the library (docs/context §N2.4), a direct
// port of DailyTracker/src/styles/global.css:261's existing workaround: many
// griddy-icons hardcode an inner <path fill="black">, which no root <svg>
// prop can reach. Scoped to [data-bobuttons-icon] (the Icon wrapper), so it
// never needs !important.
const ICON_FILL_OVERRIDE_CSS =
  "[data-bobuttons-icon] svg path { fill: currentColor; }";

/**
 * BobuttonsProvider({ theme = "default", children }) renders
 * `<TamaguiProvider config={bobuttonsConfig} defaultTheme={theme}>` with NO
 * inner `<Theme>` and NO `key`.
 *
 * This is deliberate, not an oversight (docs/context §N1, verified against
 * @tamagui/core@3.0.18 with a jsdom + react-dom/client + act probe):
 * `TamaguiProvider`'s `defaultTheme` prop reads like an initial value but is
 * NOT one in this pinned version — it is threaded into `<Theme name>` on
 * EVERY render, so swapping it restyles the whole tree with the mount count
 * unchanged. Do not "fix" this by adding an inner `<Theme name={theme}>` or a
 * `key={theme}`: both were measured to produce the identical (correct)
 * result at the root, and a `key` would force a real remount, which AC9
 * explicitly forbids. See BobuttonsProvider.remount.test.tsx for the
 * regression guard. If a future @tamagui/core upgrade changes this behaviour,
 * treat it as an AC9 re-verification, not a routine version bump.
 *
 * Subtree caveat: this provider themes the whole document. A story that
 * needs two themes side by side needs its own inner `<Theme name>` —
 * BobuttonsProvider is root-only and is not that tool.
 *
 * Review finding (high, AC16): `TamaguiProvider` sets the theme's `color`
 * CSS variable on an inner wrapper (`style="color:var(--color)"`, verified
 * by SSR probe) but never paints `background-color`, so anything with a
 * transparent fill (e.g. the `ghost` Button variant) sat on the browser's
 * default white canvas instead of the theme's `$background` — the measured
 * cause of `ghost`'s jade-aa colour-contrast failure. This wrapping `View`
 * paints `$background`/`$color` once, at the root, using existing theme
 * tokens only (no new colour, per the out-of-scope rule).
 */
export function BobuttonsProvider(props: BobuttonsProviderProps): React.ReactElement {
  const { theme = "default", children } = props;
  return (
    <TamaguiProvider config={bobuttonsConfig} defaultTheme={theme}>
      <style data-bobuttons-icon-style="" dangerouslySetInnerHTML={{ __html: ICON_FILL_OVERRIDE_CSS }} />
      <View backgroundColor="$background" minHeight="100%">
        {children}
      </View>
    </TamaguiProvider>
  );
}
