/* eslint-disable bobuttons/no-raw-style-literals -- a fixed CSS-named-colour lookup table and a computed rgb() string, not a themeable UI value (the web half keeps using Tamagui tokens unchanged) */
const NAMED_COLORS: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
};

// Approximates CSS `oklch(from <fill> calc(l - 0.12) c h)` by subtracting a
// fixed amount from each RGB channel. Not perceptually identical to OKLCh —
// recorded as an allowed rendering difference in the README's parity
// section, not asserted as pixel-exact. Deliberately NOT unified with the
// web half's relative-colour CSS: computing the darker edge colour in JS on
// both platforms would change web pixels, because JS RGB arithmetic is not
// the browser's OKLCh.
function darken(color: string, amount: number): string | undefined {
  const hex = NAMED_COLORS[color.toLowerCase()] ?? color;
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  const group = match?.[1];
  if (!group) return undefined;
  const num = Number.parseInt(group, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export interface TileDepthStyle {
  borderBottomWidth?: number;
  borderBottomColor?: string;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevationAndroid?: number;
}

/**
 * Native half: resolves to plain Tamagui-recognised cross-platform style
 * PROPS (`shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`/
 * `elevationAndroid`, `@tamagui/helpers`'s own `validStyleProps` names —
 * NOT the web half's custom-property `style` object, which the shared
 * caller spreads unconditionally since the two shapes don't collide). RN
 * 0.79 ships real `shadow*`/elevation support, so this is a reasonable
 * approximation of the web drop shadow rather than a flat loss.
 */
export function tileDepthStyle(
  toCss: (color: string) => string,
  fill: string,
  depth: number,
  shadowOffset: number,
  shadowBlur: number,
  raised: boolean,
  shadow: boolean
): TileDepthStyle {
  const result: TileDepthStyle = {};
  if (raised) {
    result.borderBottomWidth = depth;
    result.borderBottomColor = darken(toCss(fill), 31) ?? toCss(fill);
  }
  if (shadow) {
    result.shadowColor = "#000";
    result.shadowOffset = { width: 0, height: shadowOffset };
    result.shadowOpacity = 0.65;
    result.shadowRadius = shadowBlur;
    result.elevationAndroid = Math.max(2, Math.round(shadowOffset));
  }
  return result;
}
