import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Text, View } from "@tamagui/core";
import { expect, within } from "storybook/test";
import { Icon } from "../components/primitives/Icon/Icon.js";
import { basicIcons, Circle, Star } from "./basic.js";

// One grid per pack, iterating the pack's own record, so adding an icon to the
// manifest shows up here with no edit. Decorative (no label) so each icon is
// aria-hidden and axe stays clean in both themed projects.
function BasicGrid(): React.ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap="$4">
      {Object.entries(basicIcons).map(([name, Component]) => (
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

const meta: Meta<typeof BasicGrid> = {
  title: "Icons/Basic",
  component: BasicGrid,
};
export default meta;

type Story = StoryObj<typeof BasicGrid>;

export const Grid: Story = {};

// Guards the one place a pack icon can silently go wrong in a real browser:
// BobuttonsProvider injects `[data-bobuttons-icon] svg path { fill: currentColor }`
// and Icon adds that attribute to every icon it wraps. The pack renderer sets an
// inline `fill: none` on every element, which must beat that rule on a <path>
// (Star) AND on a non-path element (Circle's <circle>, which the rule's selector
// never matches, so a path-only fix would pass by luck). Stroke must resolve to
// the themed colour, not the black default.
export const CascadeGuard: Story = {
  render: () => (
    <View data-testid="cascade-guard" flexDirection="row" gap="$4">
      <Icon source={Star} size={32} color="primary" />
      <Icon source={Circle} size={32} color="primary" />
    </View>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId("cascade-guard");
    const path = root.querySelector("svg path");
    const circle = root.querySelector("svg circle");
    await expect(path).not.toBeNull();
    await expect(circle).not.toBeNull();
    const frameColor = getComputedStyle(root.querySelector("[data-bobuttons-icon]") as Element).color;
    for (const el of [path, circle] as Element[]) {
      const cs = getComputedStyle(el);
      await expect(cs.fill).toBe("none");
      await expect(cs.stroke).toBe(frameColor);
    }
  },
};
