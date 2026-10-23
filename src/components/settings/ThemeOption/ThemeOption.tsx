import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Card = styled(View, {
  flex: 1,
  minWidth: "$12",
  alignItems: "center",
  gap: "$2",
  paddingVertical: "$2.5",
  paddingHorizontal: "$3.5",
  borderWidth: "$0.5",
  borderRadius: "$4",
  cursor: "pointer",
});

const Swatches = styled(View, {
  flexDirection: "row",
  gap: "$1",
});

const Dot = styled(View, {
  width: "$swatch",
  height: "$swatch",
  borderRadius: "$7",
  borderWidth: "$0.25",
  borderColor: "$borderColor",
});

const Label = styled(Text, {
  fontFamily: "body",
  fontSize: "$5",
  fontWeight: fontWeights.semibold,
});

export interface ThemeOptionProps {
  label: string;
  /** CSS colours previewing the theme. */
  swatches: ReadonlyArray<string>;
  selected: boolean;
  onSelect: () => void;
}

/** A selectable theme preview card. */
export function ThemeOption(props: ThemeOptionProps): React.ReactElement {
  const { label, swatches, selected, onSelect } = props;
  const { hovered, hoverHandlers } = useHover();

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Theme: ${label}`}
      aria-pressed={selected}
      borderColor={selected ? "$primary" : "$borderColor"}
      backgroundColor={selected ? "$primaryDim" : hovered ? "$surface3" : "$surface2"}
      onPress={onSelect}
      {...hoverHandlers}
      {...activationKeyHandlers(onSelect)}
    >
      <Swatches>
        {swatches.map((color, i) => (
          <Dot key={i} style={{ background: color }} />
        ))}
      </Swatches>
      <Label color={selected ? "$primary" : "$textDim"}>{label}</Label>
    </Card>
  );
}
