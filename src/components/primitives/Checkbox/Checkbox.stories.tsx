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

// The box is centred on the label's capitals, measured from its baseline, so it lines up whatever the
// font's ascent and descent are (centring on the line box put the text 1-2px high in some fonts).
export const Aligned: Story = {
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("checkbox", { name: "Enabled" });
    const label = canvas.getByText("Enabled");

    // A zero-size inline probe sits on the baseline.
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0";
    label.appendChild(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();

    const capCenter = baseline - (0.71 * parseFloat(getComputedStyle(label).fontSize)) / 2;
    const box = input.getBoundingClientRect();
    await expect(Math.abs((box.top + box.bottom) / 2 - capCenter)).toBeLessThan(0.5);

    // Aligning to the baseline must not make the row taller than its text.
    const row = label.parentElement!.getBoundingClientRect();
    await expect(row.height).toBeLessThanOrEqual(16);
  },
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
