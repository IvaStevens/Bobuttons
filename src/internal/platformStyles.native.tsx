import * as React from "react";
import { styled, Text, View, type Role } from "@tamagui/core";

/**
 * React Native substitutes for platformStyles.ts, spread as PROPS (not a
 * `style={}` object) just like the web half — see platformStyles.ts. MEASURED
 * against the built native bundle and RN's own typings before writing each
 * one (see scripts/native-audit.json) — four of five original assumptions in
 * this ticket's hazard list turned out wrong, most dangerously `INLINE_FLEX`:
 * RN's `display` is `"none" | "flex" | "contents"` and its DEFAULT is
 * already `"flex"`, so a naive `{ display: "flex" }` substitute would
 * STRETCH every one of these components to the full width of its parent.
 * The correct substitute is `alignSelf: "flex-start"`, which sizes the view
 * to its content without touching `flexDirection`/`flex` on the parent.
 */
export const INLINE_FLEX: { alignSelf: "flex-start" } = { alignSelf: "flex-start" };

/**
 * `INLINE_FLEX` for content that its parent centres. `alignSelf:
 * "flex-start"` overrides the parent's `alignItems: "center"` and pins the
 * content to its left edge, so centred content uses `alignSelf: "center"`.
 */
export const CENTERED_INLINE_FLEX: { alignSelf: "center" } = { alignSelf: "center" };

/** React Native has no viewport unit; `flex: 1` fills the available space. */
export const FILL_VIEWPORT: { flex: 1 } = { flex: 1 };

/** Outside RN's `CursorValue`; there is no native substitute for "not-allowed". */
export const DISABLED_CURSOR: Record<string, never> = {};

/**
 * `data-*` attributes have no native meaning: Tamagui's native prop handler
 * silently drops unknown `data-*` keys (measured — it does not warn), so
 * this is bundle hygiene and a B2-AC12 scan token, not a B2-AC2 defect risk.
 */
export function dataAttrs(_name: string, _value?: string): Record<string, never> {
  return {};
}

/**
 * Android's accessibility touch-target minimum (Material Design / WCAG
 * 2.5.5): roughly 48dp. B2-AC20/D7 (plan approval, review round 3): where
 * that exceeds a control's existing web-equivalent painted box, grow ONLY
 * the invisible hit area (`hitSlop`), never the box itself — web pixel
 * sizes are non-negotiable (B2-AC11). If a painted box ever has to change
 * to meet the minimum instead, that is a B2-AC16 parity item recorded when
 * the owner reviews parity by hand, not something this helper decides.
 */
const MIN_TOUCH_TARGET_DP = 48;

/**
 * Returns RN `Insets` that grow a control's `hitSlop` to the ~48dp minimum
 * on whichever axis its painted size (dp — the same numbers driving its
 * Tamagui layout, e.g. a token's resolved pixel value or a measured
 * `width`/`height`) falls short, split evenly across both edges of that
 * axis. Pass `undefined` (or `0` — no real painted size is ever exactly 0)
 * for an axis already known to be content-driven and adequate (e.g. a
 * full-width row) to skip growing it — this never returns a NEGATIVE pad,
 * so an axis already >= the minimum, or omitted, gets exactly 0.
 */
export function touchHitSlop(
  paintedWidth?: number,
  paintedHeight?: number
): { top: number; bottom: number; left: number; right: number } {
  const horizontal = paintedWidth ? Math.max(0, Math.ceil((MIN_TOUCH_TARGET_DP - paintedWidth) / 2)) : 0;
  const vertical = paintedHeight ? Math.max(0, Math.ceil((MIN_TOUCH_TARGET_DP - paintedHeight) / 2)) : 0;
  return { top: vertical, bottom: vertical, left: horizontal, right: horizontal };
}

/**
 * Native half of IconButtonHost (review round 4, finding 1 — B2-AC20/D7).
 * The web host is a Tamagui `Text` (`isText`), which Tamagui's native
 * renderer maps to RN's `Text` host (`getBaseViews.native.js`:
 * `BaseComponent = isText ? BaseText : BaseView`). Android's hit-area
 * growth (`hitSlop`) is honoured only on views implementing
 * `ReactHitSlopView` — on Android that is `ReactViewGroup` alone
 * (react-native/ReactAndroid's `touch/ReactHitSlopView.kt` has exactly one
 * implementor; `TouchTargetHelper.java` falls through to the plain
 * 0..width/height test for everything else, and RN's `Text` has no
 * `hitSlop` prop at all) — so a `hitSlop` prop applied to the web host's
 * native twin was silently ignored and IconButton's touch target never
 * actually grew. Every OTHER grown control in this library already uses a
 * `styled(View, ...)` host; IconButton was the one exception.
 *
 * Fixed by splitting the host: an outer `View` owns `onPress`/`hitSlop`/
 * accessibility/layout (the painted box is UNCHANGED — only the invisible
 * hit area grows), wrapping an inner `Text` that exists only so a raw
 * string `children` (the `CustomGlyph` story passes `"+"`) still renders
 * legally on native — React Native requires string children to sit inside
 * a `Text`. The default glyph (`CloseGlyph`, which renders a `View`) nests
 * inside that inner `Text` the same way it already did one level up,
 * inside the pre-fix `Text` host — this is not a new nesting shape.
 */
const IconButtonPressTarget = styled(View, {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  paddingHorizontal: "$1",
  cursor: "pointer",
});

const IconButtonVisual = styled(Text, {
  fontFamily: "body",
  fontSize: "$13",
});

export interface IconButtonHostProps {
  alignSelf?: "flex-start";
  role?: Role;
  tabIndex?: number;
  "aria-label"?: string;
  "aria-disabled"?: boolean;
  color?: string;
  opacity?: number;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  children?: React.ReactNode;
}

export const Frame = React.forwardRef<React.ComponentRef<typeof IconButtonPressTarget>, IconButtonHostProps>(
  function IconButtonHost({ children, color, ...rest }, ref) {
    return (
      <IconButtonPressTarget ref={ref} {...rest}>
        <IconButtonVisual color={color}>{children}</IconButtonVisual>
      </IconButtonPressTarget>
    );
  }
);
