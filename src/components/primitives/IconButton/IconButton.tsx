import * as React from "react";
import { styled, Text } from "@tamagui/core";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";

const Frame = styled(Text, {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  paddingHorizontal: "$1",
  fontFamily: "body",
  fontSize: "$13",
  cursor: "pointer",
});

export interface IconButtonProps {
  /** Accessible name; the visual is icon-only. */
  label: string;
  /** The glyph or Icon to show. */
  children: React.ReactNode;
  onPress?: () => void;
  /** "danger" highlights on hover, for destructive actions. */
  tone?: "neutral" | "danger";
  disabled?: boolean;
}

export function IconButton(props: IconButtonProps): React.ReactElement {
  const { label, children, onPress, tone = "neutral", disabled = false } = props;
  const { hovered, hoverHandlers } = useHover();
  const fire = () => {
    if (!disabled) onPress?.();
  };
  const hoverColor = tone === "danger" ? "$slaRed" : "$color";

  return (
    <Frame
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      color={hovered && !disabled ? hoverColor : "$textDim"}
      opacity={disabled ? 0.5 : 1}
      onPress={fire}
      {...hoverHandlers}
      {...activationKeyHandlers(fire)}
    >
      {children}
    </Frame>
  );
}
