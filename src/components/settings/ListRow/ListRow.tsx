import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { RadioMark } from "../../../internal/RadioMark.js";
import { activationKeyHandlers } from "../../../internal/interaction.js";
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
          onPress={onSelect}
          {...activationKeyHandlers(onSelect)}
        >
          <RadioMark checked={selected} />
        </View>
      )}
      <Info>
        <Title>{title}</Title>
        {detail && <Detail>{detail}</Detail>}
      </Info>
      {children}
    </Row>
  );
}
