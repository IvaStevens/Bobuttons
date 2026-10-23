import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Tabs } from "./Tabs.js";

const tabs = [
  { id: "github", label: "GitHub" },
  { id: "jira", label: "Jira" },
  { id: "sentry", label: "Sentry" },
  { id: "display", label: "Display" },
];

const meta: Meta<typeof Tabs> = {
  title: "Primitives/Tabs",
  component: Tabs,
  args: {
    tabs: tabs,
    current: "github",
    onChange: fn(),
    "aria-label": "Settings sections",
  },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [current, setCurrent] = React.useState("github");
    return <Tabs {...args} current={current} onChange={setCurrent} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Jira" }));
    await expect(canvas.getByRole("tab", { name: "Jira" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tab", { name: "GitHub" })).toHaveAttribute("aria-selected", "false");
  },
};
