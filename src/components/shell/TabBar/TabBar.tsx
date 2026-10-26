import * as React from "react";
import { styled, Text, useMedia, View } from "@tamagui/core";
import { useCssColor } from "../../../internal/cssColor.js";
import { useAccentFadeStyle } from "../../../internal/useAccentGradient.js";
import { activationKeyHandlers, useInteractive } from "../../../internal/interaction.js";
import { dataAttrs, touchHitSlop } from "../../../internal/platformStyles.js";
import { Scroll, type ScrollHandle } from "../../../internal/Scroll.js";
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

// In a horizontal bar each tab is as wide as its icon, and never shrinks.
const HORIZONTAL_TAB = { width: "auto", paddingHorizontal: "$3.5", paddingVertical: "$2", flexShrink: 0 } as const;

function TabItem(props: TabItemProps): React.ReactElement {
  const { id, label, icon, iconSize, active, horizontal, onSelect } = props;
  const { hovered, pressed, handlers } = useInteractive();
  const highlighted = hovered || pressed;
  const backgroundColor = active ? "$surface2" : highlighted ? "$surface" : "transparent";
  // B2-AC20/D7 touch-target seam (see the `hitSlop` prop below): painted
  // height is a conservative lower bound (ignores the label's own line
  // height in list mode, so it never UNDER-states the shortfall) from each
  // layout's own vertical padding tokens (space.ts) plus the actual
  // `iconSize` prop: HORIZONTAL_TAB's paddingVertical "$2" (8px each side)
  // in mobile/icon-only mode, or TabButton's paddingTop "$2.5" (10px) +
  // paddingBottom "$2" (8px) in the vertical list mode — inlined in the
  // prop below (not named) so this stripped comment carries the
  // derivation, not extra runtime bytes. Width is not grown in either
  // mode: TabButton is width:"100%" in list mode, and HORIZONTAL_TAB's
  // paddingHorizontal "$3.5" (14px each side) plus the icon already clears
  // 48dp in mobile mode.

  return (
    <TabButton
      id={`tab-${id}`}
      role="tab"
      tabIndex={0}
      aria-selected={active}
      // Without a visible label the tab is named by this.
      aria-label={horizontal ? label : undefined}
      backgroundColor={backgroundColor}
      {...(horizontal ? HORIZONTAL_TAB : null)}
      hitSlop={touchHitSlop(0, (horizontal ? 8 + 8 : 10 + 8) + iconSize)}
      onPress={onSelect}
      {...activationKeyHandlers(onSelect)}
      {...handlers}
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
  const scrollRef = React.useRef<ScrollHandle>(null);
  const [edges, setEdges] = React.useState({ start: false, end: false });
  const toCss = useCssColor();
  const background = toCss("$frameBackground");
  const startFade = useAccentFadeStyle("start", background);
  const endFade = useAccentFadeStyle("end", background);

  const activeIndex = shown.findIndex((t) => t.id === current);
  React.useEffect(() => {
    if (horizontal && activeIndex >= 0) scrollRef.current?.scrollChildIntoView(activeIndex);
  }, [horizontal, activeIndex]);

  const scrollBy = (direction: -1 | 1) => scrollRef.current?.scrollByPage(direction);

  const tabItems = shown.map(({ id, label, icon }) => (
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
  ));

  return (
    <Frame {...(horizontal ? HORIZONTAL_FRAME : null)}>
      {horizontal ? (
        <Scroll
          ref={scrollRef}
          horizontal
          role="tablist"
          aria-orientation="horizontal"
          aria-label={props["aria-label"]}
          flexDirection="row"
          flexGrow={0}
          flexBasis="auto"
          gap="$0.5"
          paddingVertical="$2.5"
          paddingHorizontal="$2"
          scrollPaddingInline={ARROW_WIDTH}
          onEdgesChange={setEdges}
        >
          {tabItems}
        </Scroll>
      ) : (
        <TabList role="tablist" aria-orientation="vertical" aria-label={props["aria-label"]}>
          {tabItems}
        </TabList>
      )}
      {/* Pointer-only scroll helpers: keyboard users move through the tabs themselves. */}
      {horizontal && edges.start && (
        <Arrow
          {...dataAttrs("scroll-arrow", "start")}
          aria-hidden
          left={0}
          width={ARROW_WIDTH}
          style={startFade.style}
          // Spread only when set: Tamagui treats an explicit `undefined` as
          // an override, so a future Arrow variant that defines its own
          // default `backgroundColor`/`opacity` would be silently erased by
          // these two props whenever the fade style doesn't set them (see
          // Button.tsx's `interactionStyle` for the same pattern).
          {...(startFade.backgroundColor ? { backgroundColor: startFade.backgroundColor, opacity: 0.85 } : null)}
          // B2-AC20/D7 touch-target seam (review round 3, finding 3):
          // height is fine (`top:0`/`bottom:0` spans the whole bar), so only
          // ARROW_WIDTH (28px) needs growing. Genuinely native-rendered, not
          // web-only: an Android phone in portrait always takes the
          // `mobile` branch (B2-AC28), so this arrow is the default render.
          hitSlop={touchHitSlop(ARROW_WIDTH, undefined)}
          onPress={() => scrollBy(-1)}
        >
          <ArrowGlyph>‹</ArrowGlyph>
        </Arrow>
      )}
      {horizontal && edges.end && (
        <Arrow
          {...dataAttrs("scroll-arrow", "end")}
          aria-hidden
          right={0}
          width={ARROW_WIDTH}
          style={endFade.style}
          {...(endFade.backgroundColor ? { backgroundColor: endFade.backgroundColor, opacity: 0.85 } : null)}
          hitSlop={touchHitSlop(ARROW_WIDTH, undefined)}
          onPress={() => scrollBy(1)}
        >
          <ArrowGlyph>›</ArrowGlyph>
        </Arrow>
      )}
    </Frame>
  );
}
