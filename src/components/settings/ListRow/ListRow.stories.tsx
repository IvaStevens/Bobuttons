import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { IconButton } from "../../primitives/IconButton/IconButton.js";
import { ListRow } from "./ListRow.js";

const meta: Meta<typeof ListRow> = {
  title: "Settings/ListRow",
  component: ListRow,
  args: {
    title: "Unresolved this week",
    detail: '--sort new -t 7d --query "is:unresolved"',
    selected: false,
    onSelect: undefined,
    children: (
      <IconButton label="Remove Unresolved this week" tone="danger" />
    ),
  },
};
export default meta;

type Story = StoryObj<typeof ListRow>;

export const Default: Story = {};

export const Selectable: Story = {
  args: { selected: true, onSelect: fn() },
};

export const TitleOnly: Story = {
  args: { detail: undefined },
};
