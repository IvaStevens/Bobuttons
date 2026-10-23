import { useTheme } from "@tamagui/core";
import { palette } from "../themes/themes.generated.js";

type ThemeVars = Record<string, { variable?: string } | undefined>;
const PALETTE: Record<string, string> = palette;

/**
 * Returns a function turning a colour into plain CSS: a "$token" becomes its
 * `var(--token)` for a semantic token, or its value for a palette colour (palette
 * colours are constant, so they need no variable); anything else is returned
 * unchanged. For places Tamagui props can't be used, like SVG attributes and
 * relative colour syntax.
 */
export function useCssColor(): (color: string) => string {
  const theme = useTheme() as unknown as ThemeVars;
  return (color) => {
    if (!color.startsWith("$")) return color;
    const name = color.slice(1);
    return theme[name]?.variable ?? PALETTE[name] ?? color;
  };
}
