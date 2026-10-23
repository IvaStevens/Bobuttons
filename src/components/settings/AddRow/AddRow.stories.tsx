import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TextInput } from "../../primitives/TextInput/TextInput.js";
import { AddRow } from "./AddRow.js";

const meta: Meta<typeof AddRow> = {
  title: "Settings/AddRow",
  component: AddRow,
  args: {
    onAdd: fn(),
    actionLabel: "Add",
    children: <TextInput fill value="" onChange={() => undefined} placeholder="owner/repo" aria-label="Repository" />,
  },
};
export default meta;

type Story = StoryObj<typeof AddRow>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Add" }));
    await expect(args.onAdd).toHaveBeenCalled();
  },
};

export const TwoInputs: Story = {
  args: {
    children: (
      <>
        <TextInput fill value="" onChange={() => undefined} placeholder="Preset name" aria-label="Preset name" />
        <TextInput fill mono value="" onChange={() => undefined} placeholder="--status unresolved" aria-label="Flags" />
      </>
    ),
  },
};
