/**
 * Extra props spread onto a `styled(Text, { whiteSpace: "nowrap", ... })`
 * result. MEASURED (`@tamagui/helpers`'s `nonAnimatableWebTextProps`):
 * `whiteSpace`/`textOverflow`/`wordWrap` are web-only style keys that
 * Tamagui's native style pipeline silently skips, not converts — so the
 * style object alone keeps text on one line on web but not on native. This
 * is a no-op on web, where the existing `whiteSpace`/`textOverflow` style
 * values already do the job.
 */
export const SINGLE_LINE: Record<string, never> = {};
