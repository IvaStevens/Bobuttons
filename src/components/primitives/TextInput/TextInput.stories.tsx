import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TextInput } from "./TextInput.js";

const meta: Meta<typeof TextInput> = {
  title: "Primitives/TextInput",
  component: TextInput,
  args: {
    value: "",
    onChange: fn(),
    placeholder: "owner/repo",
    type: "text",
    fill: false,
    compact: false,
    mono: false,
    saved: false,
    onEnter: fn(),
    min: undefined,
    max: undefined,
    "aria-label": "Repository",
  },
};
export default meta;

type Story = StoryObj<typeof TextInput>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { value: "acme/widgets" },
};

export const Saved: Story = {
  args: { value: "yourcompany.atlassian.net", saved: true },
};

export const Monospace: Story = {
  args: { value: "project = ENG AND status = Open", mono: true, fill: true },
};

export const Password: Story = {
  args: { value: "secret-token", type: "password", "aria-label": "API token" },
};

export const Compact: Story = {
  args: { value: "5", type: "number", compact: true, min: 1, max: 60, "aria-label": "Interval" },
};

// Controlled by local state so typing shows up.
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("");
    return <TextInput {...args} value={value} onChange={setValue} />;
  },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Repository" });
    await userEvent.type(input, "acme/widgets{Enter}");
    await expect(input).toHaveValue("acme/widgets");
    await expect(args.onEnter).toHaveBeenCalled();
  },
};

// Number inputs keep the browser's own spinner, restyled by the provider: no box, chevrons in
// theme colours. Firefox can't style its spinner, so there it is hidden.
export const NumberSpinner: Story = {
  args: { type: "number", compact: true, min: 0, max: 10, "aria-label": "Interval" },
  render: (args) => {
    const [value, setValue] = React.useState("5");
    return <TextInput {...args} value={value} onChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    // A native control's internals aren't readable through getComputedStyle, so this guards that
    // the restyling rules are present.
    const rules = document.querySelector("style[data-bobuttons-style]")?.textContent ?? "";
    await expect(rules).toContain("[data-bobuttons-input]::-webkit-inner-spin-button");
    await expect(rules).toContain("-moz-appearance: textfield");
    await expect(within(canvasElement).getByRole("spinbutton", { name: "Interval" })).toHaveValue(5);
  },
};
