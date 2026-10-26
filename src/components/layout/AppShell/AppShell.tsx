import * as React from "react";
import { styled, useMedia, View } from "@tamagui/core";
import { FILL_VIEWPORT } from "../../../internal/platformStyles.js";

// Fills the viewport: header on top, sidebar and content below.
const Frame = styled(View, {
  flex: 1,
  flexDirection: "column",
  minWidth: 0,
  position: "relative",
  backgroundColor: "$frameBackground",
});

const Body = styled(View, {
  flex: 1,
  flexDirection: "row",
  overflow: "hidden",
});

const Sidebar = styled(View, {
  flexShrink: 0,
  flexDirection: "column",
  width: "$sidebarWidth",
});

const Content = styled(View, {
  flex: 1,
  flexDirection: "column",
  overflow: "hidden",
  position: "relative",
});

export interface AppShellInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface AppShellProps {
  /** Top bar, typically an AppHeader. */
  header?: React.ReactNode;
  /** Left rail, typically a TabBar. */
  sidebar?: React.ReactNode;
  /** The active view. */
  children: React.ReactNode;
  /** Rendered above everything, e.g. an alert. */
  overlay?: React.ReactNode;
  /**
   * Safe-area insets, e.g. from `react-native-safe-area-context`'s
   * `useSafeAreaInsets()`. Safe-area handling is the consuming app's
   * responsibility (B2-AC19: no safe-area peer is declared by this
   * library); this is the one platform-neutral prop that lets a consumer
   * feed its own measured insets in. Defaults to all-zero, so web
   * rendering (and native rendering that doesn't pass it) is unchanged.
   */
  insets?: AppShellInsets;
}

export function AppShell(props: AppShellProps): React.ReactElement {
  const { header, sidebar, children, overlay, insets } = props;
  const media = useMedia();
  const { top = 0, bottom = 0, left = 0, right = 0 } = insets ?? {};
  // On mobile the sidebar moves above the content and spans the full width.
  return (
    <Frame {...FILL_VIEWPORT} paddingTop={top} paddingBottom={bottom} paddingLeft={left} paddingRight={right}>
      {header}
      <Body flexDirection={media.mobile ? "column" : "row"}>
        {sidebar && <Sidebar width={media.mobile ? "100%" : "$sidebarWidth"}>{sidebar}</Sidebar>}
        <Content>{children}</Content>
      </Body>
      {overlay}
    </Frame>
  );
}
