import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Text, View } from "@tamagui/core";
import { Icon } from "../components/primitives/Icon/Icon.js";
import { shapesIcons } from "./shapes.js";

// One grid per pack, iterating the pack's own record, so adding an icon to the
// manifest shows up here with no edit. Decorative (no label) so each icon is
// aria-hidden and axe stays clean in both themed projects.
function ShapesGrid(): React.ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap="$4">
      {Object.entries(shapesIcons).map(([name, Component]) => (
        <View key={name} alignItems="center" gap="$2">
          <Icon source={Component} size={32} />
          <Text fontFamily="body" fontSize="$9" color="$color">
            {name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const meta: Meta<typeof ShapesGrid> = {
  title: "Icons/Shapes",
  component: ShapesGrid,
};
export default meta;

type Story = StoryObj<typeof ShapesGrid>;

export const Grid: Story = {};
