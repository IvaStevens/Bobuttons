import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useInteractive } from "../../../internal/interaction.js";
import { touchHitSlop } from "../../../internal/platformStyles.js";
import { fontWeights } from "../../../tokens/fontWeights.js";
import type { BobuttonsColorToken } from "../../../types/tokens.js";

const Header = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$1.5",
  paddingTop: "$5",
  paddingBottom: "$2",
  paddingHorizontal: "$1.5",
  marginBottom: "$1.5",
  borderBottomWidth: "$0.25",
  borderBottomColor: "$borderColor",
  cursor: "pointer",
});

// The Header handles mouse clicks; this carries focus, keyboard activation and
// aria-expanded.
const Toggle = styled(View, {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: "$1.5",
  cursor: "pointer",
});

const Label = styled(Text, {
  fontFamily: "body",
  fontSize: "$7",
  fontWeight: fontWeights.semibold,
  textTransform: "uppercase",
});

const Count = styled(Text, {
  fontFamily: "body",
  fontSize: "$3",
});

const Arrow = styled(Text, {
  fontFamily: "body",
  fontSize: "$15",
  fontWeight: fontWeights.light,
  color: "$textDim",
  opacity: 0.7,
  flexShrink: 0,
});

// B2-AC20/D7 touch-target seam (see the `hitSlop` prop below): painted
// height estimated from Header's paddingTop "$5" (20px) + paddingBottom
// "$2" (8px) — both space.ts tokens — plus Label's line height at fontSize
// "$7" (12px, FONT_SIZE_PX[7]) rounded at the body font's 1.4 line-height
// multiplier (buildLineHeights in src/tamagui.config.ts) -> round(12*1.4) =
// 17, giving 20 + 8 + 17 = 45. Inlined below (not named) so this stripped
// comment carries the derivation, not extra runtime bytes — update all
// three if any token changes. Width is not grown: Header spans the full
// width of its row (`justifyContent: "space-between"`), already far past
// 48dp. Growing the hit area is applied to Header, not the Toggle View
// below it — on native, Toggle carries no `onPress` of its own
// (`activationKeyHandlers` is inert there, B2-AC5(b)); Header is the
// element RN actually treats as the press target.

export interface CollapsibleSectionProps {
  label: string;
  /** Number shown next to the label. */
  count?: number;
  children: React.ReactNode;
  /** Whether the section starts open. Defaults to true. */
  defaultOpen?: boolean;
  /** Control rendered in the header; clicking it does not toggle the section. */
  headerAction?: React.ReactNode;
  /** Colour token for the label. Defaults to the dim text colour. */
  accentToken?: BobuttonsColorToken;
}

export function CollapsibleSection(props: CollapsibleSectionProps): React.ReactElement {
  const { label, count, children, defaultOpen = true, headerAction, accentToken } = props;
  const [open, setOpen] = React.useState(defaultOpen);
  const { hovered, pressed, handlers } = useInteractive();
  const highlighted = hovered || pressed;
  const contentId = React.useId();
  const labelColor = accentToken ? `$${accentToken}` : "$textDim";
  const toggle = () => setOpen((o) => !o);

  return (
    <View>
      <Header
        opacity={highlighted ? 0.75 : 1}
        hitSlop={touchHitSlop(0, 45)}
        onPress={toggle}
        {...handlers}
      >
        <Toggle
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-controls={contentId}
          {...activationKeyHandlers(toggle)}
        >
          <Label color={labelColor}>{label}</Label>
          {count !== undefined && <Count color={labelColor}>({count})</Count>}
        </Toggle>
        {headerAction && (
          <View onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}>{headerAction}</View>
        )}
        <Arrow aria-hidden rotate={open ? "90deg" : "0deg"}>
          ›
        </Arrow>
      </Header>
      <View id={contentId} display={open ? "flex" : "none"}>
        {children}
      </View>
    </View>
  );
}
