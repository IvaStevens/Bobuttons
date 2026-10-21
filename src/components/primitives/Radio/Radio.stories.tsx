import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Radio } from "./Radio.js";

const meta: Meta<typeof Radio> = {
  title: "Primitives/Radio",
  component: Radio,
  args: {
    label: "Alarm",
    description: "Visual flash + audio chime",
    checked: false,
    onSelect: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Radio>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { checked: true },
};

export const WithoutDescription: Story = {
  args: { description: undefined },
};

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("radio", { name: /alarm/i }));
    await expect(args.onSelect).toHaveBeenCalled();
  },
};
