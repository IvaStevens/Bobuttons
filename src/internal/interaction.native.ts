import * as React from "react";
import { touchHitSlop } from "./platformStyles.native.js";

// Mirrors interaction.ts's `HitSlopSize` (not imported from it: that file
// resolves, under `moduleSuffixes`, back to THIS file from inside itself).
// Both halves are typed independently, like every other seam in this
// codebase — only the public component props need to match across
// platforms (B2-AC4), and this type is internal.
export interface HitSlopSize {
  width?: number;
  height?: number;
}

/**
 * Keyboard activation is inert on native (B2-AC5(b)): there is no keyboard
 * to press Enter/Space on an on-screen touch target. Returns no handlers
 * rather than RN equivalents, so attaching it is always safe and never fires.
 */
export function activationKeyHandlers(_activate: () => void) {
  return {};
}

/**
 * `hovered` is permanently false: pointer hover is inert on native and is
 * deliberately never emulated by press (B2-AC5(a)) — every visual state
 * reachable on web must stay reachable on native, so components map their
 * hover visual to `hovered || pressed`, which becomes a no-op `false || pressed`
 * here. `pressed` comes from RN's `onPressIn`/`onPressOut`, `focused` from
 * `onFocus`/`onBlur`.
 *
 * B2-AC20/D7 (review round 3, finding 7): `hitSlopSize`, when given, merges
 * a `hitSlop` key into the same `handlers` object every caller already
 * spreads onto its pressable element — no caller needs its own `hitSlop`
 * prop line, and the web half (interaction.ts) ignores the argument and
 * ships no `hitSlop` key at all, so this costs zero web bundle bytes.
 */
export function useInteractive(hitSlopSize?: HitSlopSize): {
  hovered: boolean;
  pressed: boolean;
  focused: boolean;
  handlers: {
    onPressIn: () => void;
    onPressOut: () => void;
    onFocus: () => void;
    onBlur: () => void;
    hitSlop?: { top: number; bottom: number; left: number; right: number };
  };
} {
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  return {
    hovered: false,
    pressed,
    focused,
    handlers: {
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      ...(hitSlopSize ? { hitSlop: touchHitSlop(hitSlopSize.width, hitSlopSize.height) } : null),
    },
  };
}

export function useHover() {
  // Inert on native: no mouse handlers exist to wire up, so `hoverHandlers`
  // is empty and `hovered` stays false for the lifetime of the component.
  return {
    hovered: false,
    hoverHandlers: {},
  };
}

/**
 * Native half of useButtonInteraction (B2-AC5(a)): `hovered` is permanently
 * false, so Button's web precedence (press beats hover beats focus)
 * collapses to press beats focus — exactly the native press feedback a
 * Button needs. No onMouseLeave-clears-focus quirk to reproduce: RN has no
 * pointer-leave event and no stale focus ring risk this seam needs to guard
 * against.
 */
export function useButtonInteraction(hitSlopSize?: HitSlopSize): {
  interaction: "hover" | "press" | "focus" | undefined;
  handlers: {
    onPressIn: () => void;
    onPressOut: () => void;
    onFocus: () => void;
    onBlur: () => void;
    hitSlop?: { top: number; bottom: number; left: number; right: number };
  };
} {
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const interaction: "hover" | "press" | "focus" | undefined = pressed ? "press" : focused ? "focus" : undefined;
  return {
    interaction,
    handlers: {
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      ...(hitSlopSize ? { hitSlop: touchHitSlop(hitSlopSize.width, hitSlopSize.height) } : null),
    },
  };
}
