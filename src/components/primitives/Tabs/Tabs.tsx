import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useInteractive } from "../../../internal/interaction.js";
import { touchHitSlop } from "../../../internal/platformStyles.js";
import { SINGLE_LINE } from "../../../internal/singleLineText.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Bar = styled(View, {
  flexShrink: 0,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "$0.5",
  paddingTop: "$2.5",
  paddingHorizontal: "$4",
  borderBottomWidth: "$0.25",
  borderBottomColor: "$borderColor",
});

const Tab = styled(View, {
  paddingVertical: "$1.5",
  paddingHorizontal: "$3",
  borderBottomWidth: "$0.5",
  borderTopLeftRadius: "$1",
  borderTopRightRadius: "$1",
  cursor: "pointer",
});

const TabLabel = styled(Text, {
  fontFamily: "body",
  fontSize: "$7",
  fontWeight: fontWeights.mediumPlus,
  whiteSpace: "nowrap",
});

// B2-AC20/D7 touch-target seam (see the `hitSlop` prop below): painted
// height estimated from paddingVertical "$1.5" (6px each side, space[1.5]
// in src/tokens/space.ts) plus TabLabel's line height at fontSize "$7"
// (12px, FONT_SIZE_PX[7]) rounded at the body font's 1.4 line-height
// multiplier (buildLineHeights in src/tamagui.config.ts) -> round(12*1.4) =
// 17, giving 6*2 + 17 = 29. Inlined below (not named) so this stripped
// comment carries the derivation, not extra runtime bytes — update both
// if either token changes. Width is deliberately NOT grown: Tab's width is
// text-driven and tabs sit side by side with only "$0.5" (2px) gap (Bar's
// `gap`), so enlarging it would risk one tab's hit area swallowing its
// neighbour's.

export interface BobuttonsTabsItem<Id extends string = string> {
  id: Id;
  label: string;
}

export interface TabsProps<Id extends string = string> {
  tabs: ReadonlyArray<BobuttonsTabsItem<Id>>;
  current: Id;
  onChange: (tab: Id) => void;
  "aria-label"?: string;
}

interface TabItemProps {
  id: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}

function TabItem(props: TabItemProps): React.ReactElement {
  const { id, label, active, onSelect } = props;
  const { hovered, pressed, handlers } = useInteractive();
  const highlighted = hovered || pressed;

  return (
    <Tab
      id={`tab-${id}`}
      role="tab"
      tabIndex={0}
      aria-selected={active}
      borderBottomColor={active ? "$primary" : "transparent"}
      hitSlop={touchHitSlop(0, 29)}
      onPress={onSelect}
      {...handlers}
      {...activationKeyHandlers(onSelect)}
    >
      <TabLabel color={active ? "$primary" : highlighted ? "$color" : "$textDim"} {...SINGLE_LINE}>
        {label}
      </TabLabel>
    </Tab>
  );
}

/** Horizontal underlined tabs, e.g. for sections within a view. */
export function Tabs<Id extends string = string>(props: TabsProps<Id>): React.ReactElement {
  const { tabs, current, onChange } = props;
  return (
    <Bar role="tablist" aria-label={props["aria-label"]}>
      {tabs.map(({ id, label }) => (
        <TabItem key={id} id={id} label={label} active={current === id} onSelect={() => onChange(id)} />
      ))}
    </Bar>
  );
}
