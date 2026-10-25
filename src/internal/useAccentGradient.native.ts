export interface AccentTextStyle {
  color: string;
  /** Always undefined on native; present so the shared call site's
   *  `style={accentText.style}` typechecks identically on both platforms. */
  style?: undefined;
}

export interface AccentBackgroundStyle {
  style?: undefined;
  backgroundColor?: string;
}

/**
 * D4 (decided at plan approval): flat-colour fallback everywhere on native,
 * not RN 0.79's experimental `experimental_backgroundImage` and not a
 * `react-native-linear-gradient`/masked-view peer. AppHeader's gradient
 * title becomes a flat `$primary` — the seam owns `color` here (not just
 * the gradient) specifically so AppHeader never renders an invisible title:
 * the shared component still passes `color="transparent"` only on web.
 */
export function useAccentTextStyle(_direction?: string, _stops?: readonly [string, string, string]): AccentTextStyle {
  return { color: "$primary" };
}

/** ViewPane's / SettingsSection's top stripe: a solid `$accent` fill. */
export function useAccentStripeStyle(_direction?: string, _stops?: readonly [string, string, string]): AccentBackgroundStyle {
  return { backgroundColor: "$accent" };
}

/**
 * TabBar's two scroll-edge fades: a flat, reduced-opacity strip in the same
 * resolved background colour, rather than a gradient to transparent.
 */
export function useAccentFadeStyle(_direction: "start" | "end", background: string): AccentBackgroundStyle {
  return { backgroundColor: background };
}
