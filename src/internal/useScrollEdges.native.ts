import * as React from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/**
 * Native half of useScrollEdges.ts. Takes a ref to the Scroll.native
 * ScrollView (via its `onScroll`/`onContentSizeChange`/`onLayout`, since
 * there is no `scrollLeft`/`clientWidth`/`scrollWidth`, no `window` resize
 * event and no `ResizeObserver` on native) instead of a DOM ref — callers
 * pass the measurements through, not a ref, because RN has no synchronous
 * layout read equivalent to `getBoundingClientRect`.
 *
 * B2-AC13 first-frame correctness (concern 4, corrected from this ticket's
 * first draft): the web hook's own `update()` recomputes both flags on every
 * call and `end` goes true -> false at the end of the track, so "state only
 * ever goes false -> true" is NOT the real invariant to preserve. The actual
 * hazard is that `onLayout` (the viewport width) and `onContentSizeChange`
 * (the content width) arrive as two SEPARATE callbacks: if `end` were computed
 * the instant either one lands, a non-scrollable bar would measure as
 * scrollable while the other dimension is still its initial zero, and a fade
 * would flash on and off. This hook holds `{ start: false, end: false }`
 * (the web hook's own initial value) until BOTH a non-zero layout width and a
 * non-zero content width have been observed at least once; only then do both
 * flags move freely on every subsequent scroll/layout/content-size event.
 */
export function useScrollEdges(): {
  edges: { start: boolean; end: boolean };
  onLayout: (e: { nativeEvent: { layout: { width: number } } }) => void;
  onContentSizeChange: (width: number) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
} {
  const [edges, setEdges] = React.useState({ start: false, end: false });
  const layoutWidth = React.useRef(0);
  const contentWidth = React.useRef(0);
  const scrollX = React.useRef(0);
  const measured = React.useRef(false);

  const recompute = React.useCallback(() => {
    if (!measured.current) {
      if (layoutWidth.current <= 0 || contentWidth.current <= 0) return;
      measured.current = true;
    }
    const start = scrollX.current > 1;
    const end = scrollX.current + layoutWidth.current < contentWidth.current - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  const onLayout = React.useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      layoutWidth.current = e.nativeEvent.layout.width;
      recompute();
    },
    [recompute]
  );

  const onContentSizeChange = React.useCallback(
    (width: number) => {
      contentWidth.current = width;
      recompute();
    },
    [recompute]
  );

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.current = e.nativeEvent.contentOffset.x;
      recompute();
    },
    [recompute]
  );

  return { edges, onLayout, onContentSizeChange, onScroll };
}
