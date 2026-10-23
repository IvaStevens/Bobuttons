import * as React from "react";
import { styled, View } from "@tamagui/core";
import { useContentInset } from "../../../internal/useContentInset.js";

const Scroller = styled(View, {
  flex: 1,
  paddingHorizontal: "$7",
  paddingBottom: "$bodyBottomInset",
});

export interface ViewBodyProps {
  children: React.ReactNode;
}

export function ViewBody(props: ViewBodyProps): React.ReactElement {
  const inset = useContentInset();
  return (
    <Scroller tabIndex={0} paddingHorizontal={inset} style={{ overflowY: "auto" }}>
      {props.children}
    </Scroller>
  );
}
