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
    const remove = within(canvasElement).getByRole("button", { name: "Remove acme/widgets" });

    // The x is drawn, not a text glyph, so it sits on the badge's vertical centre next to the label.
    const middle = (el: Element) => {
      const box = el.getBoundingClientRect();
      return (box.top + box.bottom) / 2;
    };
    const badge = remove.parentElement!;
    await expect(remove.textContent).toBe("");
    await expect(Math.abs(middle(remove.querySelector("svg")!) - middle(badge))).toBeLessThan(0.5);

    await userEvent.click(remove);
    await expect(args.onRemove).toHaveBeenCalled();
  },
};
