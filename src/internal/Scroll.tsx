import * as React from "react";
import { View, type Role, type TamaguiElement } from "@tamagui/core";
import { useScrollEdges } from "./useScrollEdges.js";

/**
 * Web half of the scroll-container seam. Used two ways: as a plain vertical
 * scroller (ViewBody, SettingsLayout — today's `style={{ overflowY: "auto" }}`
 * element, byte-equivalent) and as TabBar's horizontally-scrolling tab list,
 * which additionally needs the imperative `scrollChildIntoView`/`scrollByPage`
 * TabBar used to call directly on a DOM ref (lines 140, 179-180 before this
 * seam existed) and the scroll-edge booleans TabBar used to get from
 * `useScrollEdges(ref, enabled)` directly.
 */
export interface ScrollHandle {
  scrollChildIntoView(index: number): void;
  scrollByPage(direction: -1 | 1): void;
}

export interface ScrollProps {
  children: React.ReactNode;
  /** Scrolls sideways instead of down; only TabBar's mobile layout sets this. */
  horizontal?: boolean;
  /** Horizontal only: keeps a scrolled-to child clear of overlaid edge arrows of this width. */
  scrollPaddingInline?: number;
  tabIndex?: number;
  role?: Role;
  "aria-label"?: string;
  "aria-orientation"?: "horizontal" | "vertical";
  style?: React.CSSProperties;
  flexDirection?: "row" | "column";
  gap?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
  paddingTop?: string;
  paddingBottom?: string;
  flexGrow?: number;
  flexBasis?: string;
  onEdgesChange?: (edges: { start: boolean; end: boolean }) => void;
}

const VERTICAL_STYLE: React.CSSProperties = { overflowY: "auto" };
const HORIZONTAL_BASE_STYLE: React.CSSProperties = {
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "none",
};

export const Scroll = React.forwardRef<ScrollHandle, ScrollProps>(function Scroll(props, ref) {
  const { children, horizontal = false, scrollPaddingInline, style, onEdgesChange, ...rest } = props;
  const elRef = React.useRef<TamaguiElement | null>(null);
  const edges = useScrollEdges(elRef as React.RefObject<unknown>, horizontal);

  React.useEffect(() => {
    onEdgesChange?.(edges);
  }, [edges, onEdgesChange]);

  React.useImperativeHandle(ref, () => ({
    scrollChildIntoView(index: number) {
      const el = elRef.current as HTMLElement | null;
      const child = el?.children.item(index) as HTMLElement | null;
      child?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    },
    scrollByPage(direction: -1 | 1) {
      const el = elRef.current as HTMLElement | null;
      el?.scrollBy?.({ left: direction * (el?.clientWidth ?? 0) * 0.8, behavior: "smooth" });
    },
  }));

  return (
    <View
      ref={elRef}
      flex={1}
      style={{
        ...(horizontal ? HORIZONTAL_BASE_STYLE : VERTICAL_STYLE),
        ...(horizontal && scrollPaddingInline !== undefined ? { scrollPaddingInline } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </View>
  );
});
