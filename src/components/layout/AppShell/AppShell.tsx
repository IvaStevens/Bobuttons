import * as React from "react";
import { styled, View } from "@tamagui/core";

// Fills the viewport: header on top, sidebar and content below.
const Frame = styled(View, {
  flex: 1,
  flexDirection: "column",
  minWidth: 0,
  height: "100vh",
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

export interface AppShellProps {
  /** Top bar, typically an AppHeader. */
  header?: React.ReactNode;
  /** Left rail, typically a TabBar. */
  sidebar?: React.ReactNode;
  /** The active view. */
  children: React.ReactNode;
  /** Rendered above everything, e.g. an alert. */
  overlay?: React.ReactNode;
}

export function AppShell(props: AppShellProps): React.ReactElement {
  const { header, sidebar, children, overlay } = props;
  return (
    <Frame>
      {header}
      <Body>
        {sidebar && <Sidebar>{sidebar}</Sidebar>}
        <Content>{children}</Content>
      </Body>
      {overlay}
    </Frame>
  );
}
