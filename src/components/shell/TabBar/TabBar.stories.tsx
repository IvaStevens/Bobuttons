import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { View } from "@tamagui/core";
import { AlertTriangle, Calendar, CheckCircle, Github, Settings, StickyNote, Ticket } from "griddy-icons";
import { TabBar, type BobuttonsTab } from "./TabBar.js";

const tabs: BobuttonsTab[] = [
  { id: "today", label: "Today", icon: CheckCircle },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "jira", label: "Jira", icon: Ticket },
  { id: "github", label: "GitHub", icon: Github },
  { id: "sentry", label: "Sentry", icon: AlertTriangle },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "settings", label: "Settings", icon: Settings, pinned: true },
];

const meta: Meta<typeof TabBar> = {
  title: "Shell/TabBar",
  component: TabBar,
  decorators: [
    (Story) => (
      <View width="$sidebarWidth">
        <Story />
      </View>
    ),
  ],
  args: {
    tabs: tabs,
    current: "today",
    onChange: fn(),
    visibleTabs: undefined,
    iconSize: 28,
    "aria-label": "Sections",
  },
};
export default meta;

type Story = StoryObj<typeof TabBar>;

export const Default: Story = {};

// Only pinned tabs and tabs in the set are shown.
export const FilteredByVisibleTabs: Story = {
  args: { visibleTabs: new Set(["today", "notes"]) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("tab").map((t) => t.id)).toEqual(["tab-today", "tab-notes", "tab-settings"]);
  },
};

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Calendar" }));
    await expect(args.onChange).toHaveBeenCalledWith("calendar");
    await expect(canvas.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
  },
};
