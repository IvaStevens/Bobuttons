import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextInput } from "../../primitives/TextInput/TextInput.js";
import { SettingsRow } from "./SettingsRow.js";

const meta: Meta<typeof SettingsRow> = {
  title: "Settings/SettingsRow",
  component: SettingsRow,
  args: {
    label: "Domain",
    stacked: false,
    divider: true,
    children: <TextInput value="yourcompany.atlassian.net" onChange={() => undefined} aria-label="Domain" />,
  },
};
export default meta;

type Story = StoryObj<typeof SettingsRow>;

export const Default: Story = {};

export const Stacked: Story = {
  args: { stacked: true },
};

export const LastRow: Story = {
  args: { divider: false },
};
