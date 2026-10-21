import * as React from "react";
import { styled, Text, useTheme, View } from "@tamagui/core";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { fontWeights } from "../../../tokens/fontWeights.js";
import type { BobuttonsThemeTokenName } from "../../../types/tokens.js";
import type { IconSource } from "../../primitives/Icon/Icon.js";

// Placeholder until game colours exist in the theme: squares are white, with
// dark content on filled squares. Replace with theme tokens once they are defined.
const PLACEHOLDER_COLOR = "white";
const PLACEHOLDER_INK = "black";

const MAX_TEXT_LENGTH = 3;

// Drop shadow colour: black at high opacity, kept tight rather than soft.
const SHADOW_COLOR = "color-mix(in srgb, black 65%, transparent)";

// Bottom edge of a raised tile: the fill, always darker. Done in CSS so it
// works for tokens and any CSS colour. Browsers without relative colour
// syntax drop the declaration and the tile is simply flat.
const EDGE_LIGHTNESS_STEP = 0.12;
function edgeColor(fill: string): string {
  return `oklch(from ${fill} calc(l - ${EDGE_LIGHTNESS_STEP}) c h)`;
}

// Rows never wrap or shrink, so the grid keeps its shape when its parent is
// narrower: the overflow is clipped or scrolled by the parent instead.
const Grid = styled(View, {
  flexShrink: 0,
  alignSelf: "flex-start",
  flexDirection: "column",
  gap: "$1",
});

const Row = styled(View, {
  flexShrink: 0,
  flexDirection: "row",
  flexWrap: "nowrap",
  gap: "$1",
});

// Every square has a border, transparent unless outlined or hovered, so
// adding an outline never changes its size.
const Square = styled(View, {
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: "$2",
  borderWidth: "$0.5",
  borderColor: "transparent",
});

const Content = styled(Text, {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "body",
  fontWeight: fontWeights.bold,
});

/** A theme token ("$primary") or any CSS colour ("red", "#fff"). */
export type SquareColor = `$${BobuttonsThemeTokenName}` | (string & {});

export type SquareVariant = "filled" | "outlined";

/** How a filled square looks while hovered. Give either or both. */
export interface SquareHover {
  /** Replaces the fill. */
  color?: SquareColor;
  /** Adds an outline of this colour. */
  outline?: SquareColor;
}

interface SquareGridCellBase {
  /** Fill (filled) or outline and content (outlined). Defaults to white. */
  color?: SquareColor;
  /** Overrides the grid's `variant` for this square. */
  variant?: SquareVariant;
  /** Overrides the grid's `hover` for this square. Ignored when outlined. */
  hover?: SquareHover;
  /** Overrides the grid's `raised` for this square. Ignored when outlined. */
  raised?: boolean;
  /** Overrides the grid's `shadow` for this square. Ignored when outlined. */
  shadow?: boolean;
  /** Accessible name; give icon squares one so they aren't silent. */
  label?: string;
}

/** A square is blank, holds an icon, or holds up to 3 characters. */
export type SquareGridCell =
  | (SquareGridCellBase & { icon?: undefined; text?: string })
  | (SquareGridCellBase & { icon: IconSource; text?: undefined });

export interface SquareGridProps {
  /** Number of squares across. */
  columns: number;
  /** Number of squares down. */
  rows: number;
  /** Squares in row-major order. Missing entries are blank white squares. */
  cells?: ReadonlyArray<SquareGridCell | undefined>;
  /** Height of each tile in px. Defaults to 40. */
  squareSize?: number;
  /** Tile width divided by height. Defaults to 1 (square); above 1 gives horizontal rectangles. */
  aspectRatio?: number;
  /** Default for squares without their own `variant`. Defaults to "filled". */
  variant?: SquareVariant;
  /** Hover look for filled squares. Without it, squares don't react to hover. */
  hover?: SquareHover;
  /** Draws a 3D bottom edge on filled squares, a darker shade of the fill. */
  raised?: boolean;
  /** Adds a tight, dark drop shadow under filled squares. */
  shadow?: boolean;
  /** Called with the zero-based row and column. Makes the squares focusable. */
  onSquarePress?: (row: number, column: number) => void;
  "aria-label"?: string;
}

function toCount(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

// Counts characters, not UTF-16 units, so emoji aren't split.
function clipText(text: string): string {
  return Array.from(text).slice(0, MAX_TEXT_LENGTH).join("");
}

interface GridSquareProps {
  cell: SquareGridCell | undefined;
  height: number;
  aspectRatio: number;
  row: number;
  column: number;
  variant: SquareVariant;
  hover?: SquareHover;
  raised: boolean;
  shadow: boolean;
  onPress?: (row: number, column: number) => void;
}

type ThemeVars = Record<string, { variable?: string } | undefined>;

function GridSquare(props: GridSquareProps): React.ReactElement {
  const { cell, height, aspectRatio, row, column, onPress } = props;
  const { hovered, hoverHandlers } = useHover();
  const theme = useTheme() as unknown as ThemeVars;
  const width = Math.round(height * aspectRatio);
  // Content is sized from the shorter side so it fits either way.
  const unit = Math.min(width, height);
  const Icon = cell?.icon;
  const text = cell?.text ? clipText(cell.text) : undefined;
  const press = onPress ? () => onPress(row, column) : undefined;
  // A pressable blank square would otherwise have no name.
  const label = cell?.label ?? (press && !text ? `Row ${row + 1}, column ${column + 1}` : undefined);

  const variant = cell?.variant ?? props.variant;
  const color = cell?.color ?? PLACEHOLDER_COLOR;
  // Hover only applies to filled squares.
  const hover = variant === "filled" && hovered ? (cell?.hover ?? props.hover) : undefined;
  const fill = variant === "filled" ? (hover?.color ?? color) : "transparent";
  const outline = variant === "outlined" ? color : (hover?.outline ?? "transparent");
  const ink = variant === "filled" ? PLACEHOLDER_INK : color;

  // Raised edge and shadow draw below the tile, so the tile reserves that space.
  const filled = variant === "filled";
  const raised = filled && (cell?.raised ?? props.raised);
  const shadow = filled && (cell?.shadow ?? props.shadow);
  const depth = Math.max(2, Math.round(height * 0.08));
  const layers: string[] = [];
  if (raised) {
    const cssFill = fill.startsWith("$") ? (theme[fill.slice(1)]?.variable ?? fill) : fill;
    layers.push(`0 ${depth}px 0 ${edgeColor(cssFill)}`);
  }
  if (shadow) {
    const offset = depth + Math.max(1, Math.round(height * 0.03));
    layers.push(`0 ${offset}px ${Math.max(2, Math.round(height * 0.06))}px ${SHADOW_COLOR}`);
  }
  const tileStyle = layers.length
    ? ({ "--bobuttons-tile-shadow": layers.join(", ") } as React.CSSProperties)
    : undefined;

  return (
    <Square
      role="cell"
      aria-label={label}
      tabIndex={press ? 0 : undefined}
      cursor={press ? "pointer" : undefined}
      onPress={press}
      {...hoverHandlers}
      {...(press ? activationKeyHandlers(press) : null)}
      width={width}
      height={height}
      marginBottom={layers.length ? depth : 0}
      backgroundColor={fill}
      borderColor={outline}
      data-bobuttons-tile=""
      style={tileStyle}
    >
      {Icon && (
        <Content data-bobuttons-icon="" color={ink}>
          <Icon size={Math.round(unit * 0.55)} color="currentColor" />
        </Content>
      )}
      {text && (
        <Content color={ink} fontSize={Math.round(unit * 0.4)}>
          {text}
        </Content>
      )}
    </Square>
  );
}

/** A fixed-shape grid of small rounded squares or rectangles, each blank, an icon or a short string. */
export function SquareGrid(props: SquareGridProps): React.ReactElement {
  const { cells, squareSize = 40, variant = "filled", hover, onSquarePress } = props;
  const aspectRatio = Number.isFinite(props.aspectRatio) && props.aspectRatio! > 0 ? props.aspectRatio! : 1;
  const columns = toCount(props.columns);
  const rows = toCount(props.rows);

  return (
    <Grid role="grid" aria-label={props["aria-label"]}>
      {Array.from({ length: rows }, (_, r) => (
        <Row key={r} role="row">
          {Array.from({ length: columns }, (_, c) => (
            <GridSquare
              key={c}
              cell={cells?.[r * columns + c]}
              height={squareSize}
              aspectRatio={aspectRatio}
              raised={props.raised ?? false}
              shadow={props.shadow ?? false}
              row={r}
              column={c}
              variant={variant}
              hover={hover}
              onPress={onSquarePress}
            />
          ))}
        </Row>
      ))}
    </Grid>
  );
}
