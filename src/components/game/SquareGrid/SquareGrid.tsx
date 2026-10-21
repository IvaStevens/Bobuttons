import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { fontWeights } from "../../../tokens/fontWeights.js";
import type { BobuttonsThemeTokenName } from "../../../types/tokens.js";
import type { IconSource } from "../../primitives/Icon/Icon.js";

// Placeholder until game colours exist in the theme: squares are white, with
// dark content on filled squares. Replace with theme tokens once they are defined.
const PLACEHOLDER_COLOR = "white";
const PLACEHOLDER_INK = "black";

const MAX_TEXT_LENGTH = 3;

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
  /** Side length of each square, in px. Defaults to 40. */
  squareSize?: number;
  /** Default for squares without their own `variant`. Defaults to "filled". */
  variant?: SquareVariant;
  /** Hover look for filled squares. Without it, squares don't react to hover. */
  hover?: SquareHover;
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
  size: number;
  row: number;
  column: number;
  variant: SquareVariant;
  hover?: SquareHover;
  onPress?: (row: number, column: number) => void;
}

function GridSquare(props: GridSquareProps): React.ReactElement {
  const { cell, size, row, column, onPress } = props;
  const { hovered, hoverHandlers } = useHover();
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

  return (
    <Square
      role="cell"
      aria-label={label}
      tabIndex={press ? 0 : undefined}
      cursor={press ? "pointer" : undefined}
      onPress={press}
      {...hoverHandlers}
      {...(press ? activationKeyHandlers(press) : null)}
      width={size}
      height={size}
      backgroundColor={fill}
      borderColor={outline}
    >
      {Icon && (
        <Content data-bobuttons-icon="" color={ink}>
          <Icon size={Math.round(size * 0.55)} color="currentColor" />
        </Content>
      )}
      {text && (
        <Content color={ink} fontSize={Math.round(size * 0.4)}>
          {text}
        </Content>
      )}
    </Square>
  );
}

/** A fixed-shape grid of small rounded squares, each blank, an icon or a short string. */
export function SquareGrid(props: SquareGridProps): React.ReactElement {
  const { cells, squareSize = 40, variant = "filled", hover, onSquarePress } = props;
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
              size={squareSize}
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
