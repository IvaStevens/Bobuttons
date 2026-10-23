import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsHint } from "./SettingsHint.js";

const meta: Meta<typeof SettingsHint> = {
  title: "Settings/SettingsHint",
  component: SettingsHint,
};
export default meta;

type Story = StoryObj<typeof SettingsHint>;

export const Default: Story = {
  args: { children: "Format: org-slug/project-slug. Run `sentry auth login` to authenticate." },
};
