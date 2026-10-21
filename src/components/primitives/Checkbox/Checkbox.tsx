import * as React from "react";
import { styled, Text, useTheme, View } from "@tamagui/core";

const Row = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  gap: "$1.5",
  cursor: "pointer",
});

const Label = styled(Text, {
  fontFamily: "body",
  fontSize: "$7",
  color: "$textDim",
});

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// A native input keeps keyboard and screen-reader behaviour; clicking the label
// text toggles it through the Row.
export function Checkbox(props: CheckboxProps): React.ReactElement {
  const { label, checked, onChange, disabled = false } = props;
  const theme = useTheme();
  const labelId = React.useId();

  return (
    <Row opacity={disabled ? 0.5 : 1} onPress={() => !disabled && onChange(!checked)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-labelledby={labelId}
        style={{ margin: 0, cursor: "pointer", accentColor: theme.primary?.variable }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Label id={labelId}>{label}</Label>
    </Row>
  );
}
