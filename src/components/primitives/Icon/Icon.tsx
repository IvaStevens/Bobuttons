import * as React from "react";
import { styled, Text } from "@tamagui/core";
import { dataAttrs, INLINE_FLEX } from "../../../internal/platformStyles.js";
import { useCssColor } from "../../../internal/cssColor.js";
import type { BobuttonsColorToken } from "../../../types/tokens.js";

/**
 * Any icon component taking `size` and `color`. On web this is typically a
 * `griddy-icons` SVG component; `griddy-icons` cannot render on native
 * under any peer (its components are DOM SVG), so a React Native consumer
 * supplies its own icon components of this same shape (B2-AC18) — `Icon`'s
 * own public props are unchanged on either platform.
 */
export type IconSource = React.ComponentType<{ size?: number | string; color?: string }>;

// The wrapper sets the CSS colour from a token; on web the icon inherits it
// via `currentColor`. On native there is no "currentColor" — `Icon` passes
// the resolved colour straight into `Source`'s own `color` prop below
// instead, so a platform-appropriate native `IconSource` always receives a
// concrete value, never a `$token` or CSS keyword.
const IconFrame = styled(Text, {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export interface IconProps {
  source: IconSource;
  /** Pixel size of the icon. */
  size?: number;
  /** Colour token the icon is painted with. Defaults to the text colour. */
  color?: BobuttonsColorToken;
  /** Accessible name. Without one the icon is hidden from assistive tech. */
  label?: string;
}

export function Icon(props: IconProps): React.ReactElement {
  const { source: Source, size = 20, color = "color", label } = props;
  const toCss = useCssColor();
  const token = `$${color}`;
  return (
    <IconFrame
      {...INLINE_FLEX}
      {...dataAttrs("icon")}
      color={token}
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Source size={size} color={toCss(token)} />
    </IconFrame>
  );
}
