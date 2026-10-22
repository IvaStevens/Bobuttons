import * as React from "react";
import { styled, Text, useMedia, View } from "@tamagui/core";
import { useCssColor } from "../../../internal/cssColor.js";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { useScrollEdges } from "../../../internal/useScrollEdges.js";
import { fontWeights } from "../../../tokens/fontWeights.js";
import { Icon, type IconSource } from "../../primitives/Icon/Icon.js";

// Holds the tab list and, in a horizontal bar, the scroll arrows over its ends.
const Frame = styled(View, {
  flex: 1,
  position: "relative",
});

const TabList = styled(View, {
  flex: 1,
  flexDirection: "column",
  gap: "$0.5",
  paddingVertical: "$2.5",
  paddingHorizontal: "$2",
});

const TabButton = styled(View, {
  position: "relative",
  width: "100%",
  alignItems: "center",
  gap: "$1",
  paddingTop: "$2.5",
  paddingBottom: "$2",
  paddingHorizontal: "$1",
  borderWidth: 0,
  borderRadius: "$4",
  backgroundColor: "transparent",
  cursor: "pointer",
});

const ARROW_WIDTH = 28;

// A fade with an arrow, over one end of a horizontal bar that has more to scroll.
const Arrow = styled(View, {
  position: "absolute",
  top: 0,
  bottom: 0,
  zIndex: 1,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
});

const ArrowGlyph = styled(Text, {
  fontFamily: "body",
  fontSize: "$17",
  color: "$color",
});

// Left-edge bar marking the active tab; along the bottom edge in a horizontal bar.
const ActiveIndicator = styled(View, {
  position: "absolute",
  left: 0,
  top: "$2",
  bottom: "$2",
  width: "$0.75",
  backgroundColor: "$primary",
  borderTopRightRadius: "$7",
  borderBottomRightRadius: "$7",
});

const TabLabel = styled(Text, {
  fontFamily: "body",
  fontSize: "$3",
  fontWeight: fontWeights.mediumPlus,
});

export interface BobuttonsTab<Id extends string = string> {
  id: Id;
  label: string;
  icon: IconSource;
  /** Pinned tabs stay visible when `visibleTabs` is supplied. */
  pinned?: boolean;
}

export interface TabBarProps<Id extends string = string> {
  tabs: ReadonlyArray<BobuttonsTab<Id>>;
  current: Id;
  onChange: (tab: Id) => void;
  /** When supplied, only pinned tabs and tabs in this set are shown. */
  visibleTabs?: ReadonlySet<Id>;
  /** Pixel size of the tab icons. Defaults to 28. */
  iconSize?: number;
  "aria-label"?: string;
}

interface TabItemProps {
  id: string;
  label: string;
  icon: IconSource;
  iconSize: number;
  active: boolean;
  /** Tabs run in a horizontal row, as icons only, instead of a column. */
  horizontal: boolean;
  onSelect: () => void;
}

const HORIZONTAL_INDICATOR = {
  top: "auto",
  bottom: 0,
  left: "$2",
  right: "$2",
  width: "auto",
  height: "$0.75",
  borderTopLeftRadius: "$7",
  borderTopRightRadius: "$7",
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
} as const;

const HORIZONTAL_FRAME = { flexGrow: 0, flexBasis: "auto" } as const;

const HORIZONTAL_LIST = { flexDirection: "row", flexGrow: 0, flexBasis: "auto" } as const;

// Scrolls sideways; the scrollbar is hidden since touch scrolling is the norm here. The scroll
// padding keeps a scrolled-to tab clear of the arrows.
const HORIZONTAL_SCROLL: React.CSSProperties = {
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "none",
  scrollPaddingInline: ARROW_WIDTH,
};

// In a horizontal bar each tab is as wide as its icon, and never shrinks.
const HORIZONTAL_TAB = { width: "auto", paddingHorizontal: "$3.5", paddingVertical: "$2", flexShrink: 0 } as const;

function TabItem(props: TabItemProps): React.ReactElement {
  const { id, label, icon, iconSize, active, horizontal, onSelect } = props;
  const { hovered, hoverHandlers } = useHover();
  const ref = React.useRef<React.ComponentRef<typeof TabButton>>(null);

  // Keep the selected tab visible when the bar scrolls.
  React.useEffect(() => {
    if (active && horizontal) (ref.current as HTMLElement | null)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [active, horizontal]);
  const backgroundColor = active ? "$surface2" : hovered ? "$surface" : "transparent";

  return (
    <TabButton
      ref={ref}
      id={`tab-${id}`}
      role="tab"
      tabIndex={0}
      aria-selected={active}
      // Without a visible label the tab is named by this.
      aria-label={horizontal ? label : undefined}
      backgroundColor={backgroundColor}
      {...(horizontal ? HORIZONTAL_TAB : null)}
      onPress={onSelect}
      {...hoverHandlers}
      {...activationKeyHandlers(onSelect)}
    >
      {active && <ActiveIndicator {...(horizontal ? HORIZONTAL_INDICATOR : null)} />}
      <View opacity={active ? 1 : 0.65}>
        <Icon source={icon} size={iconSize} color={active ? "primary" : "textDim"} />
      </View>
      {!horizontal && <TabLabel color={active ? "$primary" : "$textDim"}>{label}</TabLabel>}
    </TabButton>
  );
}

export function TabBar<Id extends string = string>(props: TabBarProps<Id>): React.ReactElement {
  const { tabs, current, onChange, visibleTabs, iconSize = 28 } = props;
  const shown = visibleTabs ? tabs.filter((t) => t.pinned || visibleTabs.has(t.id)) : tabs;
  // On mobile the bar sits above the content and scrolls sideways.
  const horizontal = useMedia().mobile;
  const listRef = React.useRef<React.ComponentRef<typeof TabList>>(null);
  const edges = useScrollEdges(listRef, horizontal);
  const toCss = useCssColor();
  const background = toCss("$frameBackground");

  const scrollBy = (direction: -1 | 1) => {
    const el = listRef.current as HTMLElement | null;
    el?.scrollBy?.({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <Frame {...(horizontal ? HORIZONTAL_FRAME : null)}>
      <TabList
        ref={listRef}
        role="tablist"
        aria-orientation={horizontal ? "horizontal" : "vertical"}
        aria-label={props["aria-label"]}
        {...(horizontal ? HORIZONTAL_LIST : null)}
        style={horizontal ? HORIZONTAL_SCROLL : undefined}
      >
        {shown.map(({ id, label, icon }) => (
          <TabItem
            key={id}
            id={id}
            label={label}
            icon={icon}
            iconSize={iconSize}
            active={current === id}
            horizontal={horizontal}
            onSelect={() => onChange(id)}
          />
        ))}
      </TabList>
      {/* Pointer-only scroll helpers: keyboard users move through the tabs themselves. */}
      {horizontal && edges.start && (
        <Arrow
          data-bobuttons-scroll-arrow="start"
          aria-hidden
          left={0}
          width={ARROW_WIDTH}
          style={{ background: `linear-gradient(90deg, ${background}, transparent)` }}
          onPress={() => scrollBy(-1)}
        >
          <ArrowGlyph>‹</ArrowGlyph>
        </Arrow>
      )}
      {horizontal && edges.end && (
        <Arrow
          data-bobuttons-scroll-arrow="end"
          aria-hidden
          right={0}
          width={ARROW_WIDTH}
          style={{ background: `linear-gradient(270deg, ${background}, transparent)` }}
          onPress={() => scrollBy(1)}
        >
          <ArrowGlyph>›</ArrowGlyph>
        </Arrow>
      )}
    </Frame>
  );
}
