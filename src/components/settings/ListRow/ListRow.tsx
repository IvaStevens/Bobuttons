import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { RadioMark } from "../../../internal/RadioMark.js";
import { activationKeyHandlers } from "../../../internal/interaction.js";
import { touchHitSlop } from "../../../internal/platformStyles.js";
import { SINGLE_LINE } from "../../../internal/singleLineText.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Row = styled(View, {
  flexDirection: "row",
  alignItems: "center",
  gap: "$2",
  marginVertical: "$0.75",
  marginHorizontal: "$3.5",
  paddingVertical: "$2",
  paddingHorizontal: "$2.5",
  backgroundColor: "$surface2",
  borderWidth: "$0.25",
  borderColor: "$borderColor",
  borderRadius: "$2",
});

const Info = styled(View, {
  flex: 1,
  minWidth: 0,
  flexDirection: "column",
});

const Title = styled(Text, {
  fontFamily: "body",
  fontSize: "$9",
  fontWeight: fontWeights.mediumPlus,
  color: "$color",
});

const Detail = styled(Text, {
  fontFamily: "mono",
  fontSize: "$5",
  color: "$primary",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export interface ListRowProps {
  title: string;
  /** Secondary line in monospace, e.g. a URL or flags. */
  detail?: string;
  /** Whether this row is the selected one. Only shown when `onSelect` is set. */
  selected?: boolean;
  /** Makes the row selectable, with a radio dot before the text. */
  onSelect?: () => void;
  /** Actions after the text, e.g. IconButtons. */
  children?: React.ReactNode;
}

// B2-AC20/D7 touch-target seam (review round 3, finding 2 — see the
// `hitSlop` prop below): RadioMark's painted size is its Ring token,
// width/height "$5" (20px, space.ts) with borderWidth "$0.5" (2px,
// box-sizing includes the border) -> 20x20. Unlike Checkbox's inner
// Pressable (review finding 5), this View's immediate parent is `Row`
// above — the whole list item, not a tightly-sized wrapper — so Android's
// ancestor-bounds touch dispatch (ReactAndroid's TouchTargetHelper) has
// room to honour the full growth without being clipped to a tiny parent.
const RADIO_MARK_SIZE = 20;

export function ListRow(props: ListRowProps): React.ReactElement {
  const { title, detail, selected = false, onSelect, children } = props;
  return (
    <Row>
      {onSelect && (
        <View
          role="radio"
          tabIndex={0}
          aria-checked={selected}
          aria-label={`Select ${title}`}
          cursor="pointer"
          hitSlop={touchHitSlop(RADIO_MARK_SIZE, RADIO_MARK_SIZE)}
          onPress={onSelect}
          {...activationKeyHandlers(onSelect)}
        >
          <RadioMark checked={selected} />
        </View>
      )}
      <Info>
        <Title>{title}</Title>
        {detail && <Detail {...SINGLE_LINE}>{detail}</Detail>}
      </Info>
      {children}
    </Row>
  );
}
