import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@tamagui/core";
import { AlertTriangle, Calendar, CheckCircle, Settings } from "griddy-icons";
import { Button } from "../../primitives/Button/Button.js";
import { AppHeader } from "../../shell/AppHeader/AppHeader.js";
import { CollapsibleSection } from "../../shell/CollapsibleSection/CollapsibleSection.js";
import { TabBar, type BobuttonsTab } from "../../shell/TabBar/TabBar.js";
import { ViewBody } from "../ViewBody/ViewBody.js";
import { ViewPane } from "../ViewPane/ViewPane.js";
import { ViewToolbar } from "../ViewToolbar/ViewToolbar.js";
import { AppShell } from "./AppShell.js";

const tabs: BobuttonsTab[] = [
  { id: "today", label: "Today", icon: CheckCircle },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "settings", label: "Settings", icon: Settings },
];

const meta: Meta<typeof AppShell> = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: { fullBleed: true },
  args: {
    overlay: undefined,
    header: <AppHeader title="Daily Tracker" now={new Date("2026-10-19T12:00:00.000Z")} />,
    sidebar: <TabBar tabs={tabs} current="today" onChange={() => undefined} />,
    children: (
      <ViewPane>
        <ViewToolbar title="Today" actions={<Button label="Add" variant="ghost" />} />
        <ViewBody>
          <CollapsibleSection label="To do" count={2} accentToken="primary">
            <Text fontFamily="body" fontSize="$9" color="$color">
              Write the review notes
            </Text>
          </CollapsibleSection>
          <CollapsibleSection label="Completed" defaultOpen={false}>
            <Text fontFamily="body" fontSize="$9" color="$color">
              Ship the build
            </Text>
          </CollapsibleSection>
        </ViewBody>
      </ViewPane>
    ),
  },
};
export default meta;

type Story = StoryObj<typeof AppShell>;

export const Default: Story = {};

export const WithoutSidebar: Story = {
  args: { sidebar: undefined },
};
