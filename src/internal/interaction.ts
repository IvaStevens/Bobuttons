import * as React from "react";

/**
 * Keyboard handlers that give a `role="button"`-style element native <button>
 * behaviour: Enter fires on keydown, Space on keyup (and is prevented on
 * keydown so the page doesn't scroll).
 */
export function activationKeyHandlers(activate: () => void) {
  return {
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        activate();
      } else if (e.key === " ") {
        e.preventDefault();
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        activate();
      }
    },
  };
}

/**
 * Hover, press and focus state behind one set of event handlers, shared by
 * every interactive primitive. `useHover` (below) is a thin wrapper kept for
 * its 7 existing call sites; `useInteractive` is the platform seam itself —
 * the `.native` half makes `hovered` permanently `false` (pointer hover is
 * inert on native and is never emulated by press, B2-AC5(a)) and derives
 * `pressed`/`focused` from RN's `onPressIn`/`onPressOut`/`onFocus`/`onBlur`
 * instead of mouse events.
 */
// B2-AC20/D7 (review round 3, finding 7): accepted here, not as a new
// `hitSlop` prop line at each call site, so the touch-target growth for
// callers that already spread `handlers` costs no extra web bundle bytes —
// the web half below ignores this parameter entirely and ships no `hitSlop`
// key, while `interaction.native.ts` merges it into the same `handlers`
// object already spread onto the pressable element.
export interface HitSlopSize {
  width?: number;
  height?: number;
}

export function useInteractive(_hitSlopSize?: HitSlopSize): {
  hovered: boolean;
  pressed: boolean;
  focused: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
} {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  return {
    hovered,
    pressed,
    focused,
    handlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => {
        setHovered(false);
        setPressed(false);
      },
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  };
}

export function useHover() {
  const { hovered, handlers } = useInteractive();
  return {
    hovered,
    hoverHandlers: {
      onMouseEnter: handlers.onMouseEnter,
      onMouseLeave: handlers.onMouseLeave,
    },
  };
}

/**
 * Button's own combined interaction state (press > hover > focus), matching
 * its pre-seam onMouseEnter/Leave/Down/Up machine exactly: a mouse leave
 * clears the visual entirely, including a stale focus ring, until the next
 * `onFocus` (B2-AC11). Separate from `useInteractive` so its other 8 callers
 * keep their own independent hover/press/focus booleans.
 */
export function useButtonInteraction(_hitSlopSize?: HitSlopSize): {
  interaction: "hover" | "press" | "focus" | undefined;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
} {
  const [interaction, setInteraction] = React.useState<"hover" | "press" | "focus" | undefined>(undefined);
  return {
    interaction,
    handlers: {
      onMouseEnter: () => setInteraction("hover"),
      onMouseLeave: () => setInteraction(undefined),
      onMouseDown: () => setInteraction("press"),
      onMouseUp: () => setInteraction("hover"),
      onFocus: () => setInteraction((prev) => prev ?? "focus"),
      onBlur: () => setInteraction(undefined),
    },
  };
}
