import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Text } from "@tamagui/core";
import { Button } from "../../primitives/Button/Button.js";
import { CollapsibleSection } from "./CollapsibleSection.js";

const body = (
  <Text fontFamily="body" fontSize="$9" color="$color">
    Section content
  </Text>
);

const meta: Meta<typeof CollapsibleSection> = {
  title: "Shell/CollapsibleSection",
  component: CollapsibleSection,
  args: {
    label: "Open items",
    count: 3,
    defaultOpen: true,
    headerAction: undefined,
    accentToken: "primary",
    children: body,
  },
};
export default meta;

type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: { defaultOpen: false },
};

export const WithHeaderAction: Story = {
  args: { headerAction: <Button label="Add" variant="ghost" /> },
};

export const Plain: Story = {
  args: { count: undefined, accentToken: undefined },
};

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: /open items/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.getByText("Section content")).not.toBeVisible();
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  },
};
