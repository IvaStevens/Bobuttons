import * as React from "react";
import { styled, Text } from "@tamagui/core";
import type { BobuttonsThemeTokenName } from "../../../types/tokens.js";

/** Any icon component taking `size` and `color`, e.g. a griddy-icons icon. */
export type IconSource = React.ComponentType<{ size?: number | string; color?: string }>;

// The wrapper sets the CSS colour from a token; the icon inherits it via
// `currentColor`.
const IconFrame = styled(Text, {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export interface IconProps {
  source: IconSource;
  /** Pixel size of the icon. */
  size?: number;
  /** Colour token the icon is painted with. Defaults to the text colour. */
  color?: BobuttonsThemeTokenName;
  /** Accessible name. Without one the icon is hidden from assistive tech. */
  label?: string;
}

export function Icon(props: IconProps): React.ReactElement {
  const { source: Source, size = 20, color = "color", label } = props;
  return (
    <IconFrame
      data-bobuttons-icon=""
      color={`$${color}`}
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Source size={size} color="currentColor" />
    </IconFrame>
  );
}
