import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { useAccentStripeStyle } from "../../../internal/useAccentGradient.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Card = styled(View, {
  flexShrink: 0,
  position: "relative",
  overflow: "hidden",
  marginBottom: "$4",
  backgroundColor: "$surface",
  borderWidth: "$0.25",
  borderColor: "$borderColor",
  borderRadius: "$5",
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

const TitleBar = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: "$3",
  paddingHorizontal: "$3.5",
  borderBottomWidth: "$0.25",
  borderBottomColor: "$borderColor",
});

const Title = styled(Text, {
  fontFamily: "body",
  fontSize: "$3",
  fontWeight: fontWeights.bold,
  color: "$primary",
  textTransform: "uppercase",
});

export interface SettingsSectionProps {
  title: string;
  /** Control shown at the right of the title bar. */
  titleAction?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsSection(props: SettingsSectionProps): React.ReactElement {
  const { title, titleAction, children } = props;
  const stripe = useAccentStripeStyle("90deg", ["0%", "50%", "100%"]);

  return (
    <Card>
      <Stripe style={stripe.style} backgroundColor={stripe.backgroundColor} />
      <TitleBar>
        <Title role="heading" aria-level={3}>
          {title}
        </Title>
        {titleAction}
      </TitleBar>
      {children}
    </Card>
  );
}
