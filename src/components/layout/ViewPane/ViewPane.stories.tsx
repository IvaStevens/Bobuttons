import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, View } from "@tamagui/core";
import { ViewPane } from "./ViewPane.js";

const meta: Meta<typeof ViewPane> = {
  title: "Layout/ViewPane",
  component: ViewPane,
};
export default meta;

type Story = StoryObj<typeof ViewPane>;

export const Default: Story = {
  render: () => (
    <View backgroundColor="$frameBackground" display="flex" style={{ height: "20rem" }}>
      <ViewPane>
        <Text fontFamily="body" fontSize="$9" color="$color" padding="$7">
          View content
        </Text>
      </ViewPane>
    </View>
  ),
};
