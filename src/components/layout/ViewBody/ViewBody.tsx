import * as React from "react";
import { styled, View } from "@tamagui/core";

const Scroller = styled(View, {
  flex: 1,
  paddingHorizontal: "$7",
  paddingBottom: "$bodyBottomInset",
});

export interface ViewBodyProps {
  children: React.ReactNode;
}

export function ViewBody(props: ViewBodyProps): React.ReactElement {
  return <Scroller tabIndex={0} style={{ overflowY: "auto" }}>{props.children}</Scroller>;
}
