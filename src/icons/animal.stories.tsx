import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Text, View } from "@tamagui/core";
import { Icon } from "../components/primitives/Icon/Icon.js";
import { animalIcons } from "./animal.js";

// One grid per pack, iterating the pack's own record, so adding an icon to the
// manifest shows up here with no edit. Decorative (no label) so each icon is
// aria-hidden and axe stays clean in both themed projects.
function AnimalGrid(): React.ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap="$4">
      {Object.entries(animalIcons).map(([name, Component]) => (
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

const meta: Meta<typeof AnimalGrid> = {
  title: "Icons/Animal",
  component: AnimalGrid,
};
export default meta;

type Story = StoryObj<typeof AnimalGrid>;

export const Grid: Story = {};
