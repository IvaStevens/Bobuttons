import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Badge } from "./Badge.js";

const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  args: {
    label: "acme/widgets",
    tone: "primary",
    mono: true,
    onRemove: undefined,
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { tone: "secondary" },
};

export const Accent: Story = {
  args: { tone: "accent", mono: false, label: "Beta" },
};

export const Removable: Story = {
  args: { onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Remove acme/widgets" }));
    await expect(args.onRemove).toHaveBeenCalled();
  },
};
