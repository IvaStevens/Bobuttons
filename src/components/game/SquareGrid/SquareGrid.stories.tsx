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
    aspectRatio: 1,
    raised: false,
    shadow: false,
    variant: "filled",
    hover: undefined,
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

// Colours are theme tokens ("$primary") or any CSS colour; the default is white.
export const Colors: Story = {
  args: {
    columns: 4,
    rows: 1,
    cells: [{}, { color: "$primary", text: "A" }, { color: "$secondary", text: "B" }, { color: "$accent", text: "C" }],
  },
};

export const Outlined: Story = {
  args: {
    columns: 4,
    rows: 2,
    variant: "outlined",
    cells: [{ text: "A" }, { icon: Flash, label: "Flash" }, { color: "$primary", text: "B" }, { color: "$secondary", text: "XYZ" }],
  },
};

export const FilledAndOutlined: Story = {
  args: {
    columns: 4,
    rows: 1,
    cells: [{ text: "A" }, { variant: "outlined", text: "B" }, { color: "$primary", text: "C" }, { variant: "outlined", color: "$primary", text: "D" }],
  },
};

// Wider than tall; text and icons are sized from the shorter side.
export const Rectangles: Story = {
  args: {
    columns: 3,
    rows: 2,
    aspectRatio: 1.6,
    cells: [{ text: "ABC", color: "$primary" }, { icon: Flash, label: "Flash", color: "$secondary" }, { text: "7" }],
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getAllByRole("cell")[0]!.getBoundingClientRect();
    await expect(box.width / box.height).toBeCloseTo(1.6, 1);
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

// Hover adds an outline to filled squares. Colours can be tokens or raw CSS colours.
export const HoverOutline: Story = {
  args: {
    columns: 4,
    rows: 2,
    hover: { outline: "$accent" },
    cells: [{ color: "$primary" }, { color: "$secondary" }, {}, { color: "$accent" }],
    onSquarePress: fn(),
  },
};

// Hover can also replace the fill; here with passed-in colours, per grid and per square.
export const HoverColor: Story = {
  args: {
    columns: 4,
    rows: 1,
    hover: { color: "gold", outline: "white" },
    cells: [{ color: "$primary" }, { color: "$secondary" }, { hover: { color: "tomato" } }, { variant: "outlined", color: "$accent" }],
    onSquarePress: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [grid, perSquare, outlined] = [
      canvas.getByRole("cell", { name: "Row 1, column 1" }),
      canvas.getByRole("cell", { name: "Row 1, column 3" }),
      canvas.getByRole("cell", { name: "Row 1, column 4" }),
    ];
    const style = (el: HTMLElement) => getComputedStyle(el);
    // The browser's computed form of a CSS colour name.
    const resolve = (color: string) => {
      const probe = document.createElement("div");
      probe.style.color = color;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };

    // Grid-level hover: fill and outline change while hovered, and revert after.
    await userEvent.hover(grid);
    await expect(style(grid).backgroundColor).toBe(resolve("gold"));
    await expect(style(grid).borderTopColor).toBe(resolve("white"));
    await userEvent.unhover(grid);
    await expect(style(grid).backgroundColor).not.toBe(resolve("gold"));

    // A square's own hover overrides the grid's.
    await userEvent.hover(perSquare);
    await expect(style(perSquare).backgroundColor).toBe(resolve("tomato"));
    await userEvent.unhover(perSquare);

    // Outlined squares ignore hover.
    const before = style(outlined).backgroundColor;
    await userEvent.hover(outlined);
    await expect(style(outlined).backgroundColor).toBe(before);
  },
};

// Without a `hover` config squares don't react at all.
export const NoHover: Story = {
  args: { columns: 3, rows: 1, cells: [{ color: "$primary" }], onSquarePress: fn() },
};

const raisedCells: SquareGridCell[] = [
  { color: "midnightblue", text: "A" },
  { color: "lightyellow", text: "B" },
  { color: "$primary", text: "C" },
  { color: "$secondary", text: "D" },
  {},
];

// A bottom edge gives a 3D look: always a darker shade of the fill, including for light fills.
export const Raised: Story = {
  args: { columns: 5, rows: 1, raised: true, cells: raisedCells },
  play: async ({ canvasElement }) => {
    const cells = within(canvasElement).getAllByRole("cell");
    const [dark, light, white] = [cells[0], cells[1], cells[4]];
    // Mean sRGB channel value (0-255) of any CSS colour, via a canvas pixel.
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const brightness = (css: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return (r + g + b) / 3;
    };
    // The edge is the first colour in the computed box-shadow.
    const edgeColor = (shadow: string) => shadow.slice(0, shadow.indexOf(")") + 1);
    const fillOf = (el: HTMLElement) => brightness(getComputedStyle(el).backgroundColor);
    const edgeOf = (el: HTMLElement) => brightness(edgeColor(getComputedStyle(el).boxShadow));

    await expect(edgeOf(dark!)).toBeLessThan(fillOf(dark!));
    await expect(edgeOf(light!)).toBeLessThan(fillOf(light!));
    // Even white gets a visible edge.
    await expect(edgeOf(white!)).toBeLessThan(fillOf(white!));
  },
};

export const Shadow: Story = {
  args: { columns: 4, rows: 1, shadow: true, cells: raisedCells },
  play: async ({ canvasElement }) => {
    const [first] = within(canvasElement).getAllByRole("cell");
    await expect(getComputedStyle(first!).boxShadow).not.toBe("none");
  },
};

export const RaisedWithShadow: Story = {
  args: { columns: 4, rows: 2, raised: true, shadow: true, cells: raisedCells },
};

export const RaisedRectangles: Story = {
  args: { columns: 3, rows: 2, aspectRatio: 1.6, raised: true, shadow: true, squareSize: 48, cells: raisedCells },
};

// Per-square settings override the grid; outlined squares ignore raised and shadow.
export const RaisedOverrides: Story = {
  args: {
    columns: 4,
    rows: 1,
    raised: true,
    cells: [{ color: "$primary" }, { color: "$primary", raised: false }, { color: "$primary", variant: "outlined" }, { color: "$primary", shadow: true }],
  },
  play: async ({ canvasElement }) => {
    const [raised, flat, outlined, shadowed] = within(canvasElement).getAllByRole("cell");
    await expect(getComputedStyle(raised!).boxShadow).not.toBe("none");
    await expect(getComputedStyle(flat!).boxShadow).toBe("none");
    await expect(getComputedStyle(outlined!).boxShadow).toBe("none");
    await expect(getComputedStyle(shadowed!).boxShadow).not.toBe("none");
  },
};
