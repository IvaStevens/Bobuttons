import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Bar = styled(View, {
  flexShrink: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: "$3.5",
  paddingBottom: "$3",
  paddingHorizontal: "$7",
});

const Title = styled(Text, {
  fontFamily: "body",
  fontSize: "$12",
  fontWeight: fontWeights.semibold,
  color: "$color",
});

export interface ViewToolbarProps {
  /** Heading on the left. */
  title?: string;
  /** Custom content on the left, used when there is no title. */
  children?: React.ReactNode;
  /** Controls or stats on the right. */
  actions?: React.ReactNode;
}

export function ViewToolbar(props: ViewToolbarProps): React.ReactElement {
  const { title, children, actions } = props;
  return (
    <Bar>
      {title ? <Title role="heading" aria-level={2}>{title}</Title> : children}
      {actions}
    </Bar>
  );
}
