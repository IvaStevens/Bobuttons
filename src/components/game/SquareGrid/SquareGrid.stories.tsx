import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { View } from "@tamagui/core";
import { Crown, Flash, Github, Settings } from "griddy-icons";
import { SquareGrid, type SquareGridCell } from "./SquareGrid.js";

const meta: Meta<typeof SquareGrid> = {
  title: "Game/SquareGrid",
  component: SquareGrid,
  args: {
    columns: 5,
    rows: 4,
    cells: undefined,
    squareSize: 40,
    onSquarePress: undefined,
    "aria-label": "Game board",
  },
};
export default meta;

type Story = StoryObj<typeof SquareGrid>;

export const Blank: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("row")).toHaveLength(4);
    await expect(canvas.getAllByRole("cell")).toHaveLength(20);
  },
};

const letters: SquareGridCell[] = ["H", "E", "L", "L", "O", "W", "O", "R", "L", "D"].map((text) => ({ text }));

export const WithText: Story = {
  args: { columns: 5, rows: 2, cells: letters },
};

// Text is clipped to 3 characters.
export const ThreeCharacters: Story = {
  args: {
    columns: 4,
    rows: 1,
    cells: [{ text: "A" }, { text: "AB" }, { text: "ABC" }, { text: "ABCDE" }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // "ABC" and the clipped "ABCDE" both render as "ABC".
    await expect(canvas.getAllByText("ABC")).toHaveLength(2);
    await expect(canvas.queryByText("ABCDE")).toBeNull();
  },
};

export const WithIcons: Story = {
  args: {
    columns: 4,
    rows: 1,
    cells: [
      { icon: Flash, label: "Flash" },
      { icon: Crown, label: "Crown" },
      { icon: Github, label: "GitHub" },
      { icon: Settings, label: "Settings" },
    ],
  },
};

export const Mixed: Story = {
  args: {
    columns: 4,
    rows: 2,
    cells: [{ text: "7" }, undefined, { icon: Flash, label: "Flash" }, { text: "XYZ" }, undefined, { icon: Crown, label: "Crown" }],
  },
};

// Per-square colour comes from theme tokens; the default is white.
export const Colors: Story = {
  args: {
    columns: 4,
    rows: 1,
    cells: [{}, { color: "primary", text: "A" }, { color: "secondary", text: "B" }, { color: "accent", text: "C" }],
  },
};

export const SmallSquares: Story = {
  args: { columns: 10, rows: 6, squareSize: 20 },
};

// A parent narrower than the grid clips it; the rows must not wrap.
export const OverflowDoesNotWrap: Story = {
  args: { columns: 12, rows: 3, squareSize: 48 },
  decorators: [
    (Story) => (
      <View width="$inputWidth" overflow="hidden">
        <Story />
      </View>
    ),
  ],
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("row");
    for (const row of rows) {
      const tops = Array.from(row.children).map((cell) => cell.getBoundingClientRect().top);
      await expect(new Set(tops).size).toBe(1);
      await expect(tops).toHaveLength(12);
    }
  },
};

// Squares report their zero-based row and column.
export const Pressable: Story = {
  args: {
    columns: 4,
    rows: 3,
    cells: [{ text: "A" }],
    onSquarePress: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("cell", { name: "Row 3, column 4" }));
    await expect(args.onSquarePress).toHaveBeenLastCalledWith(2, 3);
    canvas.getByRole("cell", { name: "A" }).focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSquarePress).toHaveBeenLastCalledWith(0, 0);
  },
};
