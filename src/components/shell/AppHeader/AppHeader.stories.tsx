import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Monday, October 19")).toBeInTheDocument();
  },
};

export const GermanLocale: Story = {
  args: { title: "Tagesplaner", locale: "de-DE", timeZone: "Europe/Berlin" },
};

// On mobile there is no sidebar column, so the title moves left and the date is dropped.
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Daily Tracker" })).toBeInTheDocument();
    await expect(canvas.queryByText(/October/)).toBeNull();
  },
};
