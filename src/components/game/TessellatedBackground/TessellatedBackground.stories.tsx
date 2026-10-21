import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { View } from "@tamagui/core";
import { Crown, DiamondGem, Flash, Fire, Heart, HalloweenGhost, Rocket, Star } from "griddy-icons";
import { SquareGrid, type SquareGridCell } from "../SquareGrid/SquareGrid.js";
import { TessellatedBackground, type TessellatedIcon } from "./TessellatedBackground.js";

// Each icon has one fixed size wherever it appears.
const icons: TessellatedIcon[] = [
  { source: Star, size: 44 },
  { source: Crown, size: 36 },
  { source: Heart, size: 30 },
  { source: Flash, size: 26 },
  { source: Rocket, size: 22 },
];

const meta: Meta<typeof TessellatedBackground> = {
  title: "Game/TessellatedBackground",
  component: TessellatedBackground,
  args: {
    icons,
    seed: 1,
    tileSize: 240,
    copies: 2,
    tilt: 20,
    color: "$color",
    opacity: 0.12,
    children: undefined,
  },
  decorators: [
    (Story) => (
      <View style={{ width: "36rem", height: "22rem" }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TessellatedBackground>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg[data-bobuttons-pattern]")!;
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    // Many icons are drawn once in the tile, not once across the whole area.
    await expect(svg.querySelectorAll("pattern g[transform]").length).toBeGreaterThanOrEqual(icons.length * 2);
    await expect(svg.querySelectorAll("pattern g[transform]").length).toBeLessThan(40);
  },
};

export const DifferentSeed: Story = {
  args: { seed: 42 },
};

export const Upright: Story = {
  args: { tilt: 0 },
};

export const MoreCopies: Story = {
  args: { copies: 4, tileSize: 360 },
};

export const MoreVisible: Story = {
  args: { opacity: 0.3, color: "$primary" },
};

const eight: TessellatedIcon[] = [
  ...icons,
  { source: DiamondGem, size: 32 },
  { source: Fire, size: 28 },
  { source: HalloweenGhost, size: 24 },
];

export const EightIcons: Story = {
  args: { icons: eight, tileSize: 320 },
};

const letters = "BOBUTTONSGAMEPLAYTILES!".split("");
const board: SquareGridCell[] = Array.from({ length: 25 }, (_, i) => ({
  text: letters[i % letters.length],
  color: (["$primary", "$secondary", "$accent"] as const)[i % 3],
}));

// A background behind a 5x5 grid of raised squares with a shadow.
export const BehindSquareGrid: Story = {
  args: { opacity: 0.16 },
  render: (args) => (
    <TessellatedBackground {...args}>
      <View flex={1} alignItems="center" justifyContent="center">
        <View alignSelf="center">
          <SquareGrid columns={5} rows={5} cells={board} squareSize={40} raised shadow aria-label="Game board" />
        </View>
      </View>
    </TessellatedBackground>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("cell")).toHaveLength(25);
  },
};
