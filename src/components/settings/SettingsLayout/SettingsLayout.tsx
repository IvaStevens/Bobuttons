import * as React from "react";
import { styled, View } from "@tamagui/core";
import { useContentInset } from "../../../internal/useContentInset.js";

const Frame = styled(View, {
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
});

const Scroller = styled(View, {
  flex: 1,
  paddingTop: "$5",
  paddingHorizontal: "$6",
  paddingBottom: "$12",
});

export interface SettingsLayoutProps {
  /** Tab bar shown above the content, typically Tabs. */
  tabs?: React.ReactNode;
  /** The active settings tab's sections. */
  children: React.ReactNode;
}

/** A tab bar over a scrolling area for stacked SettingsSections. */
export function SettingsLayout(props: SettingsLayoutProps): React.ReactElement {
  const inset = useContentInset("$6");
  return (
    <Frame>
      {props.tabs}
      <Scroller tabIndex={0} paddingHorizontal={inset} style={{ overflowY: "auto" }}>
        {props.children}
      </Scroller>
    </Frame>
  );
}
