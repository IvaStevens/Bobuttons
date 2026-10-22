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

// Without a description the label is centred in the card, level with the mark.
export const WithoutDescription: Story = {
  args: { description: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio", { name: /alarm/i });
    const title = canvas.getByText("Alarm");

    // The title's cap midline, from its baseline (a zero-size inline probe sits on it).
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0";
    title.appendChild(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();
    const capCenter = baseline - (0.71 * parseFloat(getComputedStyle(title).fontSize)) / 2;

    const card = radio.getBoundingClientRect();
    const mark = radio.querySelector("[data-bobuttons-radio-mark]")!.getBoundingClientRect();
    // Centred in the card by its capitals, which a centred line box misses by 1-2px in some fonts...
    await expect(Math.abs(capCenter - (card.top + card.bottom) / 2)).toBeLessThan(0.75);
    // ...and the mark is level with the label.
    await expect(Math.abs((mark.top + mark.bottom) / 2 - capCenter)).toBeLessThan(0.75);
  },
};

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("radio", { name: /alarm/i }));
    await expect(args.onSelect).toHaveBeenCalled();
  },
};
