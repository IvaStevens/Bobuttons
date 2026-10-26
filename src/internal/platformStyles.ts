import { styled, Text } from "@tamagui/core";

/**
 * Web-only style values used across components, isolated here so the
 * `.native.ts` sibling can hold their React Native substitutes without a
 * Platform.OS branch in any component. Every value below is exactly what the
 * component used inline before this seam existed — this file changes no web
 * pixel (B2-AC11).
 *
 * Each constant is spread directly onto a Tamagui component as PROPS (e.g.
 * `<Frame {...INLINE_FLEX}>`), not nested inside a `style={}` object, and is
 * typed narrowly (not as `React.CSSProperties`) so spreading it doesn't
 * widen the element's prop type to every CSS property Tamagui's own prop
 * types disagree with (e.g. `background`).
 *
 * This file (and fontFamilies.ts) is why eslint.config.js's
 * `bobuttons/no-raw-style-literals` scope was extended to `src/internal/**`
 * and `src/tokens/**`: moving these literals out of `src/components/**`
 * must not move them out of that rule's reach.
 */

/** Sizes an inline element to its content instead of stretching full width. */
export const INLINE_FLEX: { display: "inline-flex" } = { display: "inline-flex" };

/**
 * `INLINE_FLEX` for content that its parent centres (`alignItems: "center"`).
 * Identical on web; on native `INLINE_FLEX`'s `alignSelf: "flex-start"` would
 * override that centring and pin the content to the parent's left edge.
 */
export const CENTERED_INLINE_FLEX: { display: "inline-flex" } = INLINE_FLEX;

/** Fills the viewport height. React Native has no viewport unit. */
export const FILL_VIEWPORT: { height: "100vh" } = { height: "100vh" };

/**
 * `cursor: "not-allowed"` is outside React Native's `CursorValue`
 * ("auto" | "pointer"); every other `cursor` value in the component tree is
 * RN-valid and stays on the shared path (see scripts/native-audit.json).
 */
export const DISABLED_CURSOR: { cursor: "not-allowed" } = { cursor: "not-allowed" };

/**
 * Bobuttons' own `data-*` attributes: styling hooks for BobuttonsProvider's
 * injected CSS (e.g. `[data-bobuttons-icon] svg path`) and the one
 * test/story query-selector hook (TabBar's scroll arrows). Returns the
 * attribute pair unchanged on web; the `.native` half drops it.
 */
export function dataAttrs(name: string, value = ""): Record<string, string> {
  return { [`data-bobuttons-${name}`]: value };
}

/**
 * No-op on web. Android's ~48dp touch-target minimum (B2-AC20/D7) has no web
 * analogue: `hitSlop` is a React Native-only concept with no DOM/CSS
 * equivalent, and Tamagui's own web `Pressable` emulation does not implement
 * it the way its native one does. Returning `undefined` (rather than, say,
 * an `Insets` object) means the `hitSlop` prop React Native expands is never
 * even set on web, so this changes no web prop and no web pixel (B2-AC11).
 * This export exists only so every call site stays ONE shared line of
 * component code — see platformStyles.native.tsx for the real computation.
 */
export const touchHitSlop = (_paintedWidth?: number, _paintedHeight?: number): undefined => undefined;

/**
 * IconButton's press/visual host (B2-AC20/D7, review round 4 finding 1).
 * Deliberately NOT its own `src/internal/*` file pair: a dedicated seam file
 * would add a new module boundary (and bundler path comment) to the web
 * bundle for a component that otherwise needs no web change at all, so this
 * lives inside the existing `platformStyles` seam instead, under the exact
 * same exported name (`Frame`) IconButton.tsx used locally before — raw web
 * bytes are unchanged (see README's "Dist size" fifth raise for the
 * measured, disclosed gzip-only delta from relocating this declaration).
 * The styling below is exactly what IconButton's local `Frame` was before
 * this moved here; `platformStyles.native.tsx`'s half is a structurally
 * different View+Text split (see there for why) resolved by the SAME
 * bundler-sibling mechanism as every other value in this file.
 */
export const Frame = styled(Text, {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  paddingHorizontal: "$1",
  fontFamily: "body",
  fontSize: "$13",
  cursor: "pointer",
});
