import * as React from "react";
import { styled, View } from "@tamagui/core";

const Group = styled(View, {
  flexDirection: "column",
  gap: "$2",
});

export interface RadioGroupProps {
  /** Accessible name for the group. */
  label: string;
  children: React.ReactNode;
}

export function RadioGroup(props: RadioGroupProps): React.ReactElement {
  return (
    <Group role="radiogroup" aria-label={props.label}>
      {props.children}
    </Group>
  );
}
