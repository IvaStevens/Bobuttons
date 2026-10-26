import { useTheme } from "@tamagui/core";
import { palette } from "../themes/themes.generated.js";

type ThemeVars = Record<string, { val?: string } | undefined>;
const PALETTE: Record<string, string> = palette;

/**
 * Native half of cssColor.ts (B2-AC12): every theme-value read on the
 * shared path must resolve to a concrete value on native, never a
 * `var(--token)` string — an unresolved `var(--...)` renders nothing on
 * React Native. Returns the theme's resolved value (`.val`, not `.variable`)
 * for a semantic token, or the constant palette value; anything else
 * (already a concrete colour, e.g. "white", "#fff") is returned unchanged.
 * A `$token` that resolves to neither throws, rather than silently
 * returning the unusable `$token` string — "fails loudly" per B2-AC12.
 */
export function useCssColor(): (color: string) => string {
  const theme = useTheme() as unknown as ThemeVars;
  return (color) => {
    if (!color.startsWith("$")) return color;
    const name = color.slice(1);
    const resolved = theme[name]?.val ?? PALETTE[name];
    if (resolved === undefined) {
      throw new Error(`[bobuttons] useCssColor: no theme or palette value for "${color}" on native.`);
    }
    return resolved;
  };
}
