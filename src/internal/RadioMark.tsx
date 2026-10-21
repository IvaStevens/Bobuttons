import * as React from "react";
import { styled, View } from "@tamagui/core";

const Ring = styled(View, {
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "$5",
  height: "$5",
  borderWidth: "$0.5",
  borderRadius: "$7",
});

const Dot = styled(View, {
  width: "$2",
  height: "$2",
  borderRadius: "$7",
  backgroundColor: "$primary",
});

/** The circular radio indicator, shared by Radio and ListRow. */
export function RadioMark(props: { checked: boolean }): React.ReactElement {
  return <Ring borderColor={props.checked ? "$primary" : "$textFaint"}>{props.checked && <Dot />}</Ring>;
}
