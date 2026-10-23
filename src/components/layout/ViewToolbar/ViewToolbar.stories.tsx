import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@tamagui/core";
import { Button } from "../../primitives/Button/Button.js";
import { ViewToolbar } from "./ViewToolbar.js";

const meta: Meta<typeof ViewToolbar> = {
  title: "Layout/ViewToolbar",
  component: ViewToolbar,
  args: {
    title: "Open pull requests",
    children: undefined,
    actions: <Button label="Refresh" variant="ghost" />,
  },
};
export default meta;

type Story = StoryObj<typeof ViewToolbar>;

export const Default: Story = {};

export const CustomContent: Story = {
  args: {
    title: undefined,
    children: (
      <Text fontFamily="body" fontSize="$11" color="$color">
        Monday, October 19
      </Text>
    ),
    actions: undefined,
  },
};

// Content insets tighten on smaller screens.
export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
