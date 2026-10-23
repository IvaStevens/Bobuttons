import * as React from "react";

/**
 * Whether a horizontally scrolling element has more content beyond its start
 * or end edge, kept current as it scrolls and resizes.
 */
export function useScrollEdges(ref: React.RefObject<unknown>, enabled: boolean): { start: boolean; end: boolean } {
  const [edges, setEdges] = React.useState({ start: false, end: false });

  React.useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!enabled || !el) {
      setEdges((prev) => (prev.start || prev.end ? { start: false, end: false } : prev));
      return;
    }

    const update = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [ref, enabled]);

  return edges;
}
