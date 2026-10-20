import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "./Button.js";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  args: {
    label: "Submit",
    variant: "primary",
    disabled: false,
    "aria-label": undefined,
    onPress: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// AC9: this single story, re-rendered under every theme via the toolbar
// decorator (.storybook/preview.tsx), is the proof that switching themes
// restyles the component with nothing re-mounted or re-coded per theme — the
// story itself never branches on theme name.
export const Primary: Story = {
  args: { label: "Submit", variant: "primary" },
};

export const Secondary: Story = {
  args: { label: "Cancel", variant: "secondary" },
};

export const Ghost: Story = {
  args: { label: "More", variant: "ghost" },
};

export const Disabled: Story = {
  args: { label: "Unavailable", disabled: true },
};

// AC21 Slice 1: play functions covering hover/focus/press — one of the
// spike's untested items.
export const Interactive: Story = {
  args: { label: "Press me" },
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { onPress?: () => void } }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Press me" });
    await userEvent.hover(button);
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    // Review finding (medium): a role="button" div is not keyboard-operable
    // by default — browsers only synthesise a click from Enter/Space for
    // native interactive elements. Assert the Button's own key handlers
    // (not browser-synthesised behaviour) actually fire onPress.
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onPress).toHaveBeenCalledTimes(3);
  },
};
