import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { themes } from "../../../themes/themes.generated.js";
import { ThemeOption } from "./ThemeOption.js";

const ocean = themes.ocean;

const meta: Meta<typeof ThemeOption> = {
  title: "Settings/ThemeOption",
  component: ThemeOption,
  args: {
    label: "Sample",
    swatches: [ocean.background, ocean.primary, ocean.secondary, ocean.accent],
    selected: false,
    onSelect: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof ThemeOption>;

export const Unselected: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Theme: Sample" }));
    await expect(args.onSelect).toHaveBeenCalled();
  },
};

export const Selected: Story = {
  args: { selected: true },
};
