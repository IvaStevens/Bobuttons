import * as React from "react";
import { styled, View } from "@tamagui/core";
import { Button } from "../../primitives/Button/Button.js";

const Row = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  gap: "$2",
  paddingTop: "$1.5",
  paddingBottom: "$2.5",
  paddingHorizontal: "$3.5",
});

export interface AddRowProps {
  /** One or more inputs; give each `fill` so they share the width. */
  children: React.ReactNode;
  onAdd: () => void;
  /** Text of the action button. Defaults to "Add". */
  actionLabel?: string;
}

/** A row of inputs followed by an action button. */
export function AddRow(props: AddRowProps): React.ReactElement {
  const { children, onAdd, actionLabel = "Add" } = props;
  return (
    <Row>
      {children}
      <Button label={actionLabel} onPress={onAdd} />
    </Row>
  );
}
