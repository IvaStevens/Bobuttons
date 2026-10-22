import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@tamagui/core";
import { expect, userEvent, within } from "storybook/test";
import { AlertTriangle, Calendar, CheckCircle, Github, Settings, StickyNote, Ticket } from "griddy-icons";
import { breakpoints } from "../../../tokens/breakpoints.js";
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
  { id: "jira", label: "Jira", icon: Ticket },
  { id: "github", label: "GitHub", icon: Github },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "notes", label: "Notes", icon: StickyNote },
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

// The layout changes with the viewport: a sidebar column beside the content, and on mobile a
// horizontally scrolling bar above it. Each story sets its viewport, which applies in the
// Storybook UI and in the test runs.
async function expectLayout(canvasElement: HTMLElement, layout: "desktop" | "tablet" | "mobile") {
  const canvas = within(canvasElement);
  const mobile = layout === "mobile";
  const tablist = canvas.getByRole("tablist");

  await expect(window.matchMedia(`(max-width: ${breakpoints.mobile}px)`).matches).toBe(mobile);
  await expect(window.matchMedia(`(max-width: ${breakpoints.tablet}px)`).matches).toBe(layout !== "desktop");
  await expect(tablist).toHaveAttribute("aria-orientation", mobile ? "horizontal" : "vertical");
  await expect(getComputedStyle(tablist).flexDirection).toBe(mobile ? "row" : "column");
  if (!mobile) return;

  // Above the content, scrolling sideways because the tabs don't all fit.
  const content = canvas.getByRole("heading", { name: "Today" });
  await expect(tablist.getBoundingClientRect().bottom).toBeLessThanOrEqual(content.getBoundingClientRect().top);
  await expect(getComputedStyle(tablist).overflowX).toBe("auto");
  await expect(tablist.scrollWidth).toBeGreaterThan(tablist.clientWidth);

  // Selecting a tab scrolls it into view.
  const last = canvas.getByRole("tab", { name: "Settings" });
  await userEvent.click(last);
  const bar = tablist.getBoundingClientRect();
  const tab = last.getBoundingClientRect();
  await expect(tab.right).toBeLessThanOrEqual(bar.right + 1);
  await expect(tab.left).toBeGreaterThanOrEqual(bar.left - 1);
}

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: ({ canvasElement }) => expectLayout(canvasElement, "desktop"),
};

export const Tablet: Story = {
  globals: { viewport: { value: "tablet", isRotated: false } },
  play: ({ canvasElement }) => expectLayout(canvasElement, "tablet"),
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: ({ canvasElement }) => expectLayout(canvasElement, "mobile"),
};
