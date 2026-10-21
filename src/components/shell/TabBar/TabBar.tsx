import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { fontWeights } from "../../../tokens/fontWeights.js";
import { Icon, type IconSource } from "../../primitives/Icon/Icon.js";

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

// Left-edge bar marking the active tab.
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
  onSelect: () => void;
}

function TabItem(props: TabItemProps): React.ReactElement {
  const { id, label, icon, iconSize, active, onSelect } = props;
  const { hovered, hoverHandlers } = useHover();
  const backgroundColor = active ? "$surface2" : hovered ? "$surface" : "transparent";

  return (
    <TabButton
      id={`tab-${id}`}
      role="tab"
      tabIndex={0}
      aria-selected={active}
      backgroundColor={backgroundColor}
      onPress={onSelect}
      {...hoverHandlers}
      {...activationKeyHandlers(onSelect)}
    >
      {active && <ActiveIndicator />}
      <View opacity={active ? 1 : 0.65}>
        <Icon source={icon} size={iconSize} color={active ? "primary" : "textDim"} />
      </View>
      <TabLabel color={active ? "$primary" : "$textDim"}>{label}</TabLabel>
    </TabButton>
  );
}

export function TabBar<Id extends string = string>(props: TabBarProps<Id>): React.ReactElement {
  const { tabs, current, onChange, visibleTabs, iconSize = 28 } = props;
  const shown = visibleTabs ? tabs.filter((t) => t.pinned || visibleTabs.has(t.id)) : tabs;

  return (
    <TabList role="tablist" aria-orientation="vertical" aria-label={props["aria-label"]}>
      {shown.map(({ id, label, icon }) => (
        <TabItem
          key={id}
          id={id}
          label={label}
          icon={icon}
          iconSize={iconSize}
          active={current === id}
          onSelect={() => onChange(id)}
        />
      ))}
    </TabList>
  );
}
