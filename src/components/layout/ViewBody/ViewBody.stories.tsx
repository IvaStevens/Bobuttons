import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, View } from "@tamagui/core";
import { ViewBody } from "./ViewBody.js";

const rows = Array.from({ length: 30 }, (_, i) => i + 1);

const meta: Meta<typeof ViewBody> = {
  title: "Layout/ViewBody",
  component: ViewBody,
};
export default meta;

type Story = StoryObj<typeof ViewBody>;

// Scrolls within a fixed-height parent.
export const Scrolling: Story = {
  render: () => (
    <View height="$sidebarWidth" flexDirection="column" display="flex" style={{ height: "20rem" }}>
      <ViewBody>
        {rows.map((n) => (
          <Text key={n} fontFamily="body" fontSize="$9" color="$color" paddingVertical="$1.5">
            Row {n}
          </Text>
        ))}
      </ViewBody>
    </View>
  ),
};
