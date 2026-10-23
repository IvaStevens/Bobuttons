import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { IconButton } from "./IconButton.js";

const meta: Meta<typeof IconButton> = {
  title: "Primitives/IconButton",
  component: IconButton,
  args: {
    label: "Remove item",
    children: undefined,
    onPress: fn(),
    tone: "neutral",
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof IconButton>;

export const Neutral: Story = {};

// Without children it shows a close "x" drawn as an SVG, centred whatever the font. Pass children for
// a different glyph or an Icon.
export const CustomGlyph: Story = {
  args: { label: "Add item", children: "+" },
};

export const Danger: Story = {
  args: { tone: "danger" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: "Remove item" });
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onPress).toHaveBeenCalledTimes(2);
  },
};
