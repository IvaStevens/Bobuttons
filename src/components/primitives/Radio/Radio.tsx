import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { RadioMark } from "../../../internal/RadioMark.js";
import { activationKeyHandlers, useHover } from "../../../internal/interaction.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

const Card = styled(View, {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: "$3",
  paddingVertical: "$3",
  paddingHorizontal: "$3.5",
  borderWidth: "$0.25",
  borderRadius: "$5",
  cursor: "pointer",
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

  return (
    <Card
      role="radio"
      tabIndex={0}
      aria-checked={checked}
      borderColor={checked ? "$primary" : "$borderColor"}
      backgroundColor={checked ? "$primaryDim" : hovered ? "$surface3" : "$surface2"}
      onPress={onSelect}
      {...hoverHandlers}
      {...activationKeyHandlers(onSelect)}
    >
      <View marginTop="$0.5">
        <RadioMark checked={checked} />
      </View>
      <View flex={1} gap="$0.5">
        <Title>{label}</Title>
        {description && <Description>{description}</Description>}
      </View>
    </Card>
  );
}
