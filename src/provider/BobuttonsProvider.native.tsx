import * as React from "react";
import { TamaguiProvider, View } from "@tamagui/core";
import { bobuttonsConfig } from "../tamagui.config.js";
import type { BobuttonsThemeName } from "../themes/themes.generated.js";

export interface BobuttonsProviderProps {
  theme?: BobuttonsThemeName;
  children: React.ReactNode;
}

/**
 * Native half. Drops the web half's `<style dangerouslySetInnerHTML>`
 * element entirely (B2-AC12): its six rules are all DOM/CSS-only
 * (`::placeholder`, a `-webkit-mask` data URI on
 * `::-webkit-inner-spin-button`, `-moz-appearance`, two `[data-*]`
 * selectors and the tile `box-shadow` custom property) and have no native
 * equivalent — each is instead handled at its own source (TextField.native,
 * tileDepth.native). `minHeight: "100%"` (the web root's fill mechanism)
 * resolves against an unsized parent on native, so the root uses `flex: 1`
 * instead.
 *
 * Same `defaultTheme`-is-live mechanism as the web half (no inner `<Theme>`,
 * no `key` — see BobuttonsProvider.tsx and BobuttonsProvider.remount.test.tsx),
 * so B2-AC15 (theme switching without remounting) is inherited from
 * @tamagui/core's native runtime rather than proven by a dedicated test in
 * this repo; verify it by hand in the scratch app (D1) before sign-off.
 */
export function BobuttonsProvider(props: BobuttonsProviderProps): React.ReactElement {
  const { theme = "default", children } = props;
  return (
    <TamaguiProvider config={bobuttonsConfig} defaultTheme={theme}>
      <View flex={1} backgroundColor="$background">
        {children}
      </View>
    </TamaguiProvider>
  );
}
