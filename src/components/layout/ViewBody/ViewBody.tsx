import * as React from "react";
import { useContentInset } from "../../../internal/useContentInset.js";
import { Scroll } from "../../../internal/Scroll.js";

export interface ViewBodyProps {
  children: React.ReactNode;
}

// `tabIndex={0}` stays on the shared path, not behind a seam: the Scroll
// seam itself forwards `tabIndex` to React Native's `focusable` prop on its
// native half (`focusable = tabIndex >= 0`, mirroring Tamagui's own
// tabIndex->focusable convention used elsewhere in this library), so it
// needs no separate native substitute here and emits no warning (B2-AC5(c)
// — this is a mapped prop, not an inert one).
export function ViewBody(props: ViewBodyProps): React.ReactElement {
  const inset = useContentInset();
  return (
    <Scroll tabIndex={0} paddingHorizontal={inset} paddingBottom="$bodyBottomInset">
      {props.children}
    </Scroll>
  );
}
