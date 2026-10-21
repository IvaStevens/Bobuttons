import * as React from "react";
import { TamaguiProvider, View } from "@tamagui/core";
import { bobuttonsConfig } from "../tamagui.config.js";
import type { BobuttonsThemeName } from "../themes/themes.generated.js";

export interface BobuttonsProviderProps {
  /** Defaults to "default" (the :root theme). */
  theme?: BobuttonsThemeName;
  children: React.ReactNode;
}

// Many griddy-icons hardcode `<path fill="black">`, which no root <svg> prop
// can reach. Scoped to the Icon wrapper, so no !important is needed.
const ICON_FILL_OVERRIDE_CSS =
  "[data-bobuttons-icon] svg path { fill: currentColor; }";

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
      <style data-bobuttons-icon-style="" dangerouslySetInnerHTML={{ __html: ICON_FILL_OVERRIDE_CSS }} />
      <View backgroundColor="$background" minHeight="100%">
        {children}
      </View>
    </TamaguiProvider>
  );
}
