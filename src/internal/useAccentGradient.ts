import { useTheme } from "@tamagui/core";

/**
 * The secondary -> accent -> primary gradient used on the app title and the
 * view card stripe. Tamagui styles can't express gradients, so this returns a
 * CSS value built from the active theme's token variables.
 */
export function useAccentGradient(direction: string, stops?: readonly [string, string, string]): string {
  const theme = useTheme();
  const [from, via, to] = stops ?? ["20%", "65%", "100%"];
  return `linear-gradient(${direction}, ${theme.secondary?.variable} ${from}, ${theme.accent?.variable} ${via}, ${theme.primary?.variable} ${to})`;
}
