import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flash, Github } from "griddy-icons";
import { Icon } from "./Icon.js";

const meta: Meta<typeof Icon> = {
  title: "Primitives/Icon",
  component: Icon,
  args: {
    source: Flash,
    size: 24,
    color: "primary",
    label: "Flash",
  },
};
export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const Decorative: Story = {
  args: { label: undefined },
};

// Github hardcodes fill="black" on an inner path; the provider's override
// makes it follow the token colour.
export const BrandIcon: Story = {
  args: { source: Github, color: "secondary", label: "GitHub" },
};
