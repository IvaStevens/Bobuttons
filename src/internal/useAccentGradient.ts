import type * as React from "react";
import { useTheme } from "@tamagui/core";

/**
 * The secondary -> accent -> primary gradient used on the app title and the
 * view card stripe, plus TabBar's two scroll-edge fades. Tamagui styles
 * can't express gradients, so these return CSS built from the active
 * theme's token variables. The web half is byte-for-byte what each
 * component inlined before this seam existed (B2-AC11); only the *shape* —
 * style bags instead of a bare CSS string — changed, because AppHeader
 * pairs its gradient with `color="transparent"`, a Tamagui prop on the
 * shared path, so a string-only seam would leave the title invisible on a
 * platform where the gradient seam returns no colour at all. The `.native`
 * half (D4) uses the documented flat-colour fallback for all three
 * surfaces rather than RN 0.79's experimental `experimental_backgroundImage`
 * or a `react-native-linear-gradient`/masked-view peer — see README's
 * divergence list.
 */
export interface AccentTextStyle {
  color: string;
  style?: React.CSSProperties;
}

export interface AccentBackgroundStyle {
  style?: React.CSSProperties;
  backgroundColor?: string;
}

function gradient(theme: ReturnType<typeof useTheme>, direction: string, stops?: readonly [string, string, string]): string {
  const [from, via, to] = stops ?? ["20%", "65%", "100%"];
  return `linear-gradient(${direction}, ${theme.secondary?.variable} ${from}, ${theme.accent?.variable} ${via}, ${theme.primary?.variable} ${to})`;
}

/** AppHeader's title: gradient text via `color: transparent` + `background-clip: text`. */
export function useAccentTextStyle(direction: string, stops?: readonly [string, string, string]): AccentTextStyle {
  const theme = useTheme();
  return {
    color: "transparent",
    style: { background: gradient(theme, direction, stops), backgroundClip: "text" },
  };
}

/** ViewPane's / SettingsSection's top stripe. */
export function useAccentStripeStyle(direction: string, stops?: readonly [string, string, string]): AccentBackgroundStyle {
  const theme = useTheme();
  return { style: { background: gradient(theme, direction, stops) } };
}

/** TabBar's two scroll-edge fades, over a resolved CSS background colour. */
export function useAccentFadeStyle(direction: "start" | "end", background: string): AccentBackgroundStyle {
  const angle = direction === "start" ? "90deg" : "270deg";
  return { style: { background: `linear-gradient(${angle}, ${background}, transparent)` } };
}
