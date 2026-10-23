import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
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
  const { hovered, hoverHandlers } = useHover();

  return (
    <Tab
      id={`tab-${id}`}
      role="tab"
      tabIndex={0}
      aria-selected={active}
      borderBottomColor={active ? "$primary" : "transparent"}
      onPress={onSelect}
      {...hoverHandlers}
      {...activationKeyHandlers(onSelect)}
    >
      <TabLabel color={active ? "$primary" : hovered ? "$color" : "$textDim"}>{label}</TabLabel>
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
