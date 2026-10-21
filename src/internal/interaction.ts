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

export function useHover() {
  const [hovered, setHovered] = React.useState(false);
  return {
    hovered,
    hoverHandlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
  };
}
