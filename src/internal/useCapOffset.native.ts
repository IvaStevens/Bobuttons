import type * as React from "react";

// Cap height as a fraction of font size; kept identical to the web constant
// so any shared caller doing its own maths stays in sync (B2-AC14).
export const CAP_HEIGHT = 0.71;

/**
 * Native half of useCapOffset.ts (B2-AC13). There is no
 * `document.createElement`/`getBoundingClientRect`/`document.fonts` on
 * native, and no RN API returns a text element's true rendered baseline
 * synchronously. React Native's own text layout centres a single line
 * within its box much more consistently across its (far smaller) font set
 * than browsers do across arbitrary web fonts — the 1-2px correction this
 * hook exists for on web is a web-font problem. Documented justification
 * for needing no real measurement, per B2-AC13: this returns the fixed
 * pre-measurement value (0, the web hook's own initial value) and never
 * schedules a re-measure, so there is no state that flashes on and then off
 * — a flicker-free first (and only) frame by construction. Confirm this
 * holds on the manual device check (D1); if a real native font introduces a
 * visible baseline offset, replace this with an `onTextLayout` measurement
 * and record the finding in README's divergence list.
 */
export function useCapOffset(_ref: React.RefObject<unknown>, _fontSize: number, _remeasureKey?: unknown): number {
  return 0;
}
