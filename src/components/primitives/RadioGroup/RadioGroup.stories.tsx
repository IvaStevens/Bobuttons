import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Radio } from "../Radio/Radio.js";
import { RadioGroup } from "./RadioGroup.js";

const options = [
  { id: "alarm", label: "Alarm", description: "Visual flash + audio chime" },
  { id: "flash", label: "Flash only", description: "Visual flash, no sound" },
  { id: "none", label: "No alerts", description: "Meetings are silent" },
];

const meta: Meta<typeof RadioGroup> = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  args: { label: "Alert style" },
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => {
    const [selected, setSelected] = React.useState("alarm");
    return (
      <RadioGroup {...args}>
        {options.map((o) => (
          <Radio
            key={o.id}
            label={o.label}
            description={o.description}
            checked={selected === o.id}
            onSelect={() => setSelected(o.id)}
          />
        ))}
      </RadioGroup>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: /flash only/i }));
    await expect(canvas.getByRole("radio", { name: /flash only/i })).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("radio", { name: /alarm/i })).toHaveAttribute("aria-checked", "false");
  },
};
