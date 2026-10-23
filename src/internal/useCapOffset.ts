import * as React from "react";

// Cap height as a fraction of font size; close to 0.7 across common UI fonts.
export const CAP_HEIGHT = 0.71;

/**
 * How far, in px, the capitals of a single-line text element sit below the
 * centre of its line box (negative when above). Centring the line box puts the
 * capitals 1-2px off in fonts whose ascent and descent are unequal, so a
 * container centring text can shift it by minus this to centre the capitals.
 *
 * Measured from the rendered baseline, so it is right in every browser, and
 * re-measured when web fonts finish loading, and when `remeasureKey` changes (for
 * when the element appears or disappears).
 */
export function useCapOffset(ref: React.RefObject<unknown>, fontSize: number, remeasureKey?: unknown): number {
  const [offset, setOffset] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!el) return;

    const measure = () => {
      // A zero-size inline element sits on the baseline.
      const probe = document.createElement("span");
      probe.style.cssText = "display:inline-block;width:0;height:0";
      el.appendChild(probe);
      const box = el.getBoundingClientRect();
      const baseline = probe.getBoundingClientRect().bottom - box.top;
      probe.remove();

      const next = Math.round((baseline - (CAP_HEIGHT * fontSize) / 2 - box.height / 2) * 4) / 4;
      setOffset((prev) => (prev === next ? prev : next));
    };

    measure();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [ref, fontSize, remeasureKey]);

  return offset;
}
