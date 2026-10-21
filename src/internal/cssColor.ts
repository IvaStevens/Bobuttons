import { useTheme } from "@tamagui/core";

type ThemeVars = Record<string, { variable?: string } | undefined>;

/**
 * Returns a function turning a colour into plain CSS: a "$token" becomes its
 * `var(--token)`, anything else is returned unchanged. For places Tamagui
 * props can't be used, like SVG attributes and relative colour syntax.
 */
export function useCssColor(): (color: string) => string {
  const theme = useTheme() as unknown as ThemeVars;
  return (color) => (color.startsWith("$") ? (theme[color.slice(1)]?.variable ?? color) : color);
}
