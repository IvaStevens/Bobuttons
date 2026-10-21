import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Checkbox } from "./Checkbox.js";

const meta: Meta<typeof Checkbox> = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  args: {
    label: "Enabled",
    checked: false,
    onChange: fn(),
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(false);
    return <Checkbox {...args} checked={checked} onChange={setChecked} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: "Enabled" });
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await userEvent.click(canvas.getByText("Enabled"));
    await expect(box).not.toBeChecked();
  },
};
