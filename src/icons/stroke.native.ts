/* eslint-disable bobuttons/no-raw-style-literals -- React Native has no "currentColor" keyword; "#000" matches CheckGlyph.native.tsx/CloseGlyph.native.tsx's existing fallback contract. This fallback is unreachable through `Icon`, which always resolves and passes a concrete colour on both platforms (see the README divergence-list note) — it only matters for a pack component rendered directly, without `Icon` and without a `color` prop. */
export function resolveStroke(color?: string): string {
  return color ?? "#000";
}
