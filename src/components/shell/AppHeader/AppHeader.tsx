import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { formatInstant } from "../../../internal/formatInstant.js";
import { useAccentGradient } from "../../../internal/useAccentGradient.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

// Left padding matches the sidebar so the title centres over the content area.
const HeaderFrame = styled(View, {
  flexShrink: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  height: "$headerHeight",
  paddingLeft: "$sidebarWidth",
  paddingRight: "$4",
  position: "relative",
});

const Title = styled(Text, {
  fontFamily: "body",
  fontSize: "$14",
  fontWeight: fontWeights.bold,
  whiteSpace: "nowrap",
  overflow: "hidden",
});

const DateLabel = styled(Text, {
  position: "absolute",
  right: "$4",
  fontFamily: "body",
  fontSize: "$5",
  fontWeight: fontWeights.mediumPlus,
  color: "$accent",
  opacity: 0.7,
  whiteSpace: "nowrap",
});

export interface AppHeaderProps {
  /** App title, shown centred. */
  title: string;
  /** Instant the date is rendered from. Defaults to the current time. */
  now?: number | Date;
  /** Locale for the date. Defaults to "en-US". */
  locale?: string;
  /** IANA time zone for the date. Defaults to "UTC". */
  timeZone?: string;
}

export function AppHeader(props: AppHeaderProps): React.ReactElement {
  const { title, now = Date.now(), locale = "en-US", timeZone = "UTC" } = props;
  const gradient = useAccentGradient("135deg");
  const dateLabel = formatInstant(now, { locale, timeZone, weekday: "long", month: "long", day: "numeric" });

  return (
    <HeaderFrame role="banner">
      <Title
        role="heading"
        aria-level={1}
        color="transparent"
        style={{ background: gradient, backgroundClip: "text" }}
      >
        {title}
      </Title>
      <DateLabel>{dateLabel}</DateLabel>
    </HeaderFrame>
  );
}
