import * as React from "react";
import {
  ScrollView,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useScrollEdges } from "./useScrollEdges.native.js";
import { space } from "../tokens/space.js";

export interface ScrollHandle {
  scrollChildIntoView(index: number): void;
  scrollByPage(direction: -1 | 1): void;
}

export interface ScrollProps {
  children: React.ReactNode;
  horizontal?: boolean;
  /** Web-only edge-arrow clearance (CSS scroll-padding-inline); no RN equivalent, so it is accepted for type-shape parity (B2-AC4) and ignored. */
  scrollPaddingInline?: number;
  /** Mapped to RN's `focusable` below, mirroring Tamagui's own tabIndex->focusable convention (see README B2-AC5(c)). */
  tabIndex?: number;
  /** RN's `role` accepts the same string values used here ("tab"/"tablist"/etc.) and is forwarded as-is. */
  role?: string;
  /** Forwarded as RN's `aria-label` (supported directly, same prop name). */
  "aria-label"?: string;
  /**
   * No RN equivalent (ViewAccessibility.d.ts carries no `aria-orientation`).
   * Accepted for type-shape parity (B2-AC4) and otherwise inert — named in
   * the README's B2-AC5(c) divergence list.
   */
  "aria-orientation"?: "horizontal" | "vertical";
  /** Web-only (CSS style object for the scroll container). Unused on native — `horizontal` and the gap/padding props below drive the equivalent native layout. */
  style?: unknown;
  /** Intentionally unread here: `horizontal` already forces the content container's `flexDirection` to `"row"` (see below), and no caller ever passes `flexDirection="column"` — accepted for type-shape parity (B2-AC4) only. */
  flexDirection?: "row" | "column";
  gap?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
  paddingTop?: string;
  paddingBottom?: string;
  /** Forwarded into the ScrollView's own style (not the content container) so TabBar's mobile frame sizing matches the web half. */
  flexGrow?: number;
  /** Forwarded into the ScrollView's own style. RN's `flexBasis` accepts "auto" directly. */
  flexBasis?: string;
  onEdgesChange?: (edges: { start: boolean; end: boolean }) => void;
}

/** "$0.5" -> space[0.5], "$bodyBottomInset" -> space.bodyBottomInset, etc. */
function px(token: string | undefined): number | undefined {
  if (token === undefined) return undefined;
  const key = token.replace(/^\$/, "") as keyof typeof space;
  return space[key];
}

/**
 * Native half: a real `ScrollView`, since a plain React Native `View` never
 * scrolls regardless of style. Content layout (`gap`/`padding`, which the
 * web half resolves through Tamagui's own token engine) is resolved here
 * from `src/tokens/space.ts` — the one token source B2-AC14 requires — since
 * a bare `ScrollView` has no Tamagui styling. Each child's horizontal
 * position is tracked via its own `onLayout` (RN's `x`/`width` are relative
 * to the immediate parent, i.e. this ScrollView's content), which is what
 * gives `scrollChildIntoView` something to scroll to — there is no DOM
 * `children[index]` to index into on native.
 */
export const Scroll = React.forwardRef<ScrollHandle, ScrollProps>(function Scroll(props, ref) {
  const { children, horizontal = false } = props;
  const scrollRef = React.useRef<ScrollView>(null);
  const { edges, onLayout, onContentSizeChange, onScroll } = useScrollEdges();
  const layoutWidth = React.useRef(0);
  const scrollX = React.useRef(0);
  const childOffsets = React.useRef(new Map<number, { x: number; width: number }>());

  React.useEffect(() => {
    props.onEdgesChange?.(edges);
    // Deliberately depends only on `edges`, not `props.onEdgesChange` — its
    // identity is not tracked (there is no react-hooks/exhaustive-deps lint
    // rule in this project to silence, so this is just a plain comment).
  }, [edges]);

  React.useImperativeHandle(ref, () => ({
    scrollChildIntoView(index: number) {
      const offset = childOffsets.current.get(index);
      if (!offset) return;
      const viewStart = scrollX.current;
      const viewEnd = viewStart + layoutWidth.current;
      if (offset.x < viewStart) {
        scrollRef.current?.scrollTo({ x: offset.x, animated: true });
      } else if (offset.x + offset.width > viewEnd) {
        scrollRef.current?.scrollTo({ x: offset.x + offset.width - layoutWidth.current, animated: true });
      }
    },
    scrollByPage(direction: -1 | 1) {
      const next = Math.max(0, scrollX.current + direction * layoutWidth.current * 0.8);
      scrollRef.current?.scrollTo({ x: next, animated: true });
    },
  }));

  const contentContainerStyle = horizontal
    ? {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: px(props.gap),
        paddingVertical: px(props.paddingVertical),
        paddingHorizontal: px(props.paddingHorizontal),
      }
    : {
        flexGrow: 1,
        paddingTop: px(props.paddingTop),
        paddingHorizontal: px(props.paddingHorizontal),
        paddingBottom: px(props.paddingBottom),
      };

  const items = horizontal ? React.Children.toArray(children) : null;

  // Mirrors the web half's default (`flex: 1`) unless the caller specifies
  // flexGrow/flexBasis explicitly — TabBar's mobile layout passes
  // flexGrow={0} flexBasis="auto" to stop the tab strip stretching to fill
  // its Frame, exactly as it does on web (finding: this used to be silently
  // dropped, hardcoding `flex: 1` regardless of what the caller asked for).
  const outerStyle =
    props.flexGrow !== undefined || props.flexBasis !== undefined
      ? { flexGrow: props.flexGrow ?? 1, flexShrink: 1, flexBasis: (props.flexBasis ?? 0) as DimensionValue }
      : { flex: 1 };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal={horizontal}
      // RN supports `role` and `aria-label` directly on View/ScrollView
      // (same prop names as the web half); `tabIndex` has no RN prop but
      // Tamagui's own convention elsewhere in this library maps it to
      // `focusable`, so the same mapping is applied here for consistency.
      role={props.role as never}
      aria-label={props["aria-label"]}
      focusable={props.tabIndex !== undefined ? props.tabIndex >= 0 : undefined}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      style={outerStyle}
      contentContainerStyle={contentContainerStyle}
      onLayout={(e: LayoutChangeEvent) => {
        layoutWidth.current = e.nativeEvent.layout.width;
        onLayout(e);
      }}
      onContentSizeChange={(w: number) => onContentSizeChange(w)}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollX.current = e.nativeEvent.contentOffset.x;
        onScroll(e);
      }}
    >
      {items
        ? items.map((child, index) => (
            <View
              key={(React.isValidElement(child) && child.key) || index}
              onLayout={(e: LayoutChangeEvent) => {
                childOffsets.current.set(index, { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });
              }}
            >
              {child}
            </View>
          ))
        : children}
    </ScrollView>
  );
});
