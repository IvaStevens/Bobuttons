import * as React from "react";
import { styled, Text } from "@tamagui/core";

const Hint = styled(Text, {
  fontFamily: "body",
  fontSize: "$6",
  color: "$textDim",
  paddingTop: "$0.5",
  paddingBottom: "$1.5",
  paddingHorizontal: "$3.5",
});

export interface SettingsHintProps {
  children: React.ReactNode;
}

/** Small explanatory text under a section title. */
export function SettingsHint(props: SettingsHintProps): React.ReactElement {
  return <Hint>{props.children}</Hint>;
}
