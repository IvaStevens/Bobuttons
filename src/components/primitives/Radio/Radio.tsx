import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { RadioMark } from "../../../internal/RadioMark.js";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { CAP_HEIGHT, useCapOffset } from "../../../internal/useCapOffset.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

// Sizes the title-only alignment is built from; they match the `$9`, `$5` and `$3` tokens
// used below. There the mark is centred on the title's capitals, measured from its baseline.
const TITLE_SIZE = 13;
const RING_SIZE = 20;
const CARD_PADDING = 12;

const Card = styled(View, {
  flexDirection: "row",
  gap: "$3",
  paddingVertical: "$3",
  paddingHorizontal: "$3.5",
  borderWidth: "$0.25",
  borderRadius: "$5",
  cursor: "pointer",
});

// Aligns the mark's slot to the title's baseline.
const Content = styled(View, {
  flex: 1,
  flexDirection: "row",
  alignItems: "baseline",
  gap: "$3",
});

// As tall as the title's capitals and sitting on its baseline. Having no content of
// its own in flow, its baseline is its bottom edge.
const Slot = styled(View, {
  position: "relative",
  flexShrink: 0,
});

// Centred on the slot, so on the capitals' midline, whatever the font's ascent and
// descent are (centring on the line box put text 1-2px high in some fonts).
const MarkAnchor = styled(View, {
  position: "absolute",
  top: "50%",
  left: 0,
});

const Title = styled(Text, {
  fontFamily: "body",
  fontSize: "$9",
  fontWeight: fontWeights.semibold,
  color: "$color",
});

const Description = styled(Text, {
  fontFamily: "body",
  fontSize: "$6",
  color: "$textDim",
});

export interface RadioProps {
  label: string;
  description?: string;
  checked: boolean;
  onSelect: () => void;
}

/** One option card; wrap several in a RadioGroup. */
export function Radio(props: RadioProps): React.ReactElement {
  const { label, description, checked, onSelect } = props;
  const { hovered, hoverHandlers } = useHover();
  const titleRef = React.useRef<React.ComponentRef<typeof Title>>(null);
  // With no description the title is the only line, so the card centres it. That centres
  // its line box, which puts the capitals 1-2px off in some fonts; shift to centre them.
  const capOffset = useCapOffset(titleRef, TITLE_SIZE, Boolean(description));
  const cardProps = {
    role: "radio",
    tabIndex: 0,
    "aria-checked": checked,
    borderColor: checked ? "$primary" : "$borderColor",
    backgroundColor: checked ? "$primaryDim" : hovered ? "$surface3" : "$surface2",
    onPress: onSelect,
    ...hoverHandlers,
    ...activationKeyHandlers(onSelect),
  } as const;

  // With a description, the mark and the two lines sit top-aligned, as they always have.
  if (description) {
    return (
      <Card alignItems="flex-start" {...cardProps}>
        <View marginTop="$0.5">
          <RadioMark checked={checked} />
        </View>
        <View flex={1} gap="$0.5">
          <Title>{label}</Title>
          <Description>{description}</Description>
        </View>
      </Card>
    );
  }

  // Title only: centred in a card that is never shorter than the mark needs, with the
  // mark level with the label.
  return (
    <Card alignItems="center" minHeight={RING_SIZE + 2 * CARD_PADDING} {...cardProps}>
      <Content y={-capOffset}>
        <Slot width={RING_SIZE} height={CAP_HEIGHT * TITLE_SIZE}>
          <MarkAnchor style={{ transform: "translateY(-50%)" }}>
            <RadioMark checked={checked} />
          </MarkAnchor>
        </Slot>
        <View flex={1}>
          <Title ref={titleRef}>{label}</Title>
        </View>
      </Content>
    </Card>
  );
}
