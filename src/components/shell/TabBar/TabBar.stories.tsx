import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useMedia, View } from "@tamagui/core";
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

// The bar is a sidebar-width column, or full width as a horizontal bar on mobile.
function SidebarFrame(props: { children: React.ReactNode }): React.ReactElement {
  const mobile = useMedia().mobile;
  return <View width={mobile ? "100%" : "$sidebarWidth"}>{props.children}</View>;
}

const meta: Meta<typeof TabBar> = {
  title: "Shell/TabBar",
  component: TabBar,
  decorators: [
    (Story) => (
      <SidebarFrame>
        <Story />
      </SidebarFrame>
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

// On mobile the tabs are icons only in a horizontal bar that scrolls sideways, with arrows at
// whichever end has more to scroll to.
export const Mobile: Story = {
  // The narrowest preset (320px), where the seven tabs don't all fit.
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tablist = canvas.getByRole("tablist");
    const arrow = (end: "start" | "end") => canvasElement.querySelector(`[data-bobuttons-scroll-arrow="${end}"]`);

    await expect(tablist).toHaveAttribute("aria-orientation", "horizontal");
    await expect(tablist.scrollWidth).toBeGreaterThan(tablist.clientWidth);

    // Icons only, but each tab keeps its accessible name.
    await expect(canvas.queryByText("Calendar")).toBeNull();
    await expect(canvas.getByRole("tab", { name: "Calendar" })).toBeInTheDocument();

    // At the start there is more to the right only.
    await waitFor(() => expect(arrow("end")).not.toBeNull());
    await expect(arrow("start")).toBeNull();

    // The arrow scrolls the bar.
    await userEvent.click(arrow("end")!);
    await waitFor(() => expect(tablist.scrollLeft).toBeGreaterThan(0));
    await waitFor(() => expect(arrow("start")).not.toBeNull());

    // At the far end the arrows swap.
    tablist.scrollLeft = tablist.scrollWidth;
    await waitFor(() => expect(arrow("end")).toBeNull());
    await expect(arrow("start")).not.toBeNull();
  },
};
