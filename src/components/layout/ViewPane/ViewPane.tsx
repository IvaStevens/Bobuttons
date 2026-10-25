import * as React from "react";
import { styled, View } from "@tamagui/core";
import { useAccentStripeStyle } from "../../../internal/useAccentGradient.js";

// Transparent gutter that lets the frame background show around the card.
const Gutter = styled(View, {
  flex: 1,
  flexDirection: "column",
  minWidth: 0,
  overflow: "hidden",
  position: "relative",
  paddingVertical: "$1.5",
  paddingRight: "$1.5",
});

const Card = styled(View, {
  flex: 1,
  flexDirection: "column",
  minWidth: 0,
  overflow: "hidden",
  position: "relative",
  paddingTop: "$2.5",
  backgroundColor: "$surface",
  borderRadius: "$3",
});

const Stripe = styled(View, {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "$0.5",
  zIndex: 1,
  pointerEvents: "none",
});

export interface ViewPaneProps {
  children: React.ReactNode;
}

/** The surface card a view renders into, with a gradient stripe along the top. */
export function ViewPane(props: ViewPaneProps): React.ReactElement {
  const stripe = useAccentStripeStyle("90deg", ["0%", "50%", "100%"]);
  return (
    <Gutter>
      <Card>
        <Stripe style={stripe.style} backgroundColor={stripe.backgroundColor} />
        {props.children}
      </Card>
    </Gutter>
  );
}
