import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Row = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  gap: "$3",
  paddingVertical: "$2.5",
  paddingHorizontal: "$3.5",

  variants: {
    stacked: {
      true: { flexDirection: "column", alignItems: "stretch", gap: "$1.5" },
    },
  } as const,
});

const Label = styled(Text, {
  flex: 1,
  fontFamily: "body",
  fontSize: "$8",
  fontWeight: fontWeights.semibold,
  color: "$color",
});

export interface SettingsRowProps {
  label: string;
  /** The control: an input, checkbox, group of inputs, etc. */
  children: React.ReactNode;
  /** Put the label above the control instead of beside it. */
  stacked?: boolean;
  /** Draw a line under the row. Defaults to true; turn off for the last row. */
  divider?: boolean;
}

export function SettingsRow(props: SettingsRowProps): React.ReactElement {
  const { label, children, stacked, divider = true } = props;
  return (
    <Row
      stacked={stacked}
      borderBottomWidth={divider ? "$0.25" : 0}
      borderBottomColor="$borderColor"
    >
      <Label>{label}</Label>
      {children}
    </Row>
  );
}
