import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@tamagui/core";
import { Button } from "../../primitives/Button/Button.js";
import { SettingsSection } from "./SettingsSection.js";

const meta: Meta<typeof SettingsSection> = {
  title: "Settings/SettingsSection",
  component: SettingsSection,
  args: {
    title: "GitHub",
    titleAction: undefined,
    children: (
      <Text fontFamily="body" fontSize="$7" color="$color" padding="$3.5">
        Section content
      </Text>
    ),
  },
};
export default meta;

type Story = StoryObj<typeof SettingsSection>;

export const Default: Story = {};

export const WithTitleAction: Story = {
  args: { titleAction: <Button label="Reset" variant="ghost" /> },
};
