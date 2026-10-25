import * as React from "react";
import { styled, Text, useMedia, View } from "@tamagui/core";
import { formatInstant } from "../../../internal/formatInstant.js";
import { useAccentTextStyle } from "../../../internal/useAccentGradient.js";
import { SINGLE_LINE } from "../../../internal/singleLineText.js";
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
  // D4 (flat-colour fallback everywhere on native): the seam owns `color`
  // too, not just the gradient — AppHeader pairs the web gradient with
  // `color="transparent"`, so a gradient-only seam would render an
  // invisible title on a platform whose seam returns no colour at all.
  const accentText = useAccentTextStyle("135deg");
  // On mobile there is no sidebar column to centre against, so the title moves left, and the date is dropped.
  const mobile = useMedia().mobile;
  const dateLabel = formatInstant(now, { locale, timeZone, weekday: "long", month: "long", day: "numeric" });

  return (
    <HeaderFrame
      role="banner"
      {...(mobile ? { paddingLeft: "$4", justifyContent: "flex-start" } : null)}
    >
      <Title role="heading" aria-level={1} color={accentText.color} style={accentText.style} {...SINGLE_LINE}>
        {title}
      </Title>
      {/* AppHeader drops the date label on the mobile branch — the harness/manual
          check must mount this at a non-mobile width or the B2-AC26 Intl check
          passes vacuously. */}
      {!mobile && (
        <DateLabel {...SINGLE_LINE}>{dateLabel}</DateLabel>
      )}
    </HeaderFrame>
  );
}
