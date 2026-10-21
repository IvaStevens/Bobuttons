import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { IconButton } from "../IconButton/IconButton.js";

const Frame = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  gap: "$1",
  paddingVertical: "$0.75",
  paddingHorizontal: "$2",
  borderWidth: "$0.25",
  borderRadius: "$7",
});

const Label = styled(Text, {
  fontSize: "$5",
});

const TONES = {
  primary: { fill: "$primaryDim", accent: "$primary" },
  secondary: { fill: "$secondaryDim", accent: "$secondary" },
  accent: { fill: "$accentDim", accent: "$accent" },
} as const;

export interface BadgeProps {
  label: string;
  tone?: keyof typeof TONES;
  /** Monospace label, for identifiers like repo or project names. */
  mono?: boolean;
  /** When set, shows a remove button that calls this. */
  onRemove?: () => void;
}

export function Badge(props: BadgeProps): React.ReactElement {
  const { label, tone = "primary", mono = false, onRemove } = props;
  const { fill, accent } = TONES[tone];

  return (
    <Frame backgroundColor={fill} borderColor={accent}>
      <Label color={accent} fontFamily={mono ? "mono" : "body"}>
        {label}
      </Label>
      {onRemove && (
        <IconButton label={`Remove ${label}`} onPress={onRemove}>
          ×
        </IconButton>
      )}
    </Frame>
  );
}
