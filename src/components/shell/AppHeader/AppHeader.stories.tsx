import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppHeader } from "./AppHeader.js";

const meta: Meta<typeof AppHeader> = {
  title: "Shell/AppHeader",
  component: AppHeader,
  args: {
    title: "Daily Tracker",
    now: new Date("2026-10-19T12:00:00.000Z"),
    locale: "en-US",
    timeZone: "UTC",
  },
};
export default meta;

type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {};

export const GermanLocale: Story = {
  args: { title: "Tagesplaner", locale: "de-DE", timeZone: "Europe/Berlin" },
};

// On mobile there is no sidebar column, so the title moves left with the date beside it.
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
