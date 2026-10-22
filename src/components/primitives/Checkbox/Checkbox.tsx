import * as React from "react";
import { styled, Text, View } from "@tamagui/core";

// Sizes the layout is built from. The box is centred on the label's cap height,
// measured up from its baseline, so these are numbers rather than tokens.
const LABEL_SIZE = 12;
const BOX_SIZE = 14;
// Cap height as a fraction of font size; close to 0.7 across common UI fonts.
const CAP_HEIGHT = 0.71;

// Aligns the slot's bottom edge, and so the box, to the label's baseline.
const Row = styled(View, {
  flexDirection: "row",
  alignItems: "baseline",
  gap: "$1.5",
  cursor: "pointer",
});

// As tall as the label's capitals and sitting on its baseline. Having no content of
// its own, its baseline is its bottom edge whatever the box inside is doing.
const Slot = styled(View, {
  position: "relative",
  flexShrink: 0,
});

// The visible box, centred on the slot, and so on the capitals' midline. This does
// not depend on the font's ascent, descent or line gap, which is what a centred
// line box does, and which put text 1-2px high in some fonts. The real input sits
// invisibly over it.
const Box = styled(View, {
  position: "absolute",
  top: "50%",
  left: 0,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$1",
  borderWidth: "$0.5",
});

const Check = styled(Text, {
  display: "inline-flex",
  color: "$background",
});

const Label = styled(Text, {
  fontFamily: "body",
  color: "$textDim",
});

// Fills the box, invisible but still focusable and clickable.
const HIDDEN_INPUT: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  margin: 0,
  opacity: 0,
  cursor: "pointer",
};

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// The box is drawn here because a native checkbox is painted slightly off its box
// and differently per platform, so it never lined up with the label. The input
// underneath keeps native keyboard and screen-reader behaviour; clicking the label
// text toggles it through the Row.
export function Checkbox(props: CheckboxProps): React.ReactElement {
  const { label, checked, onChange, disabled = false } = props;
  const labelId = React.useId();
  const [focusVisible, setFocusVisible] = React.useState(false);

  return (
    <Row opacity={disabled ? 0.5 : 1} onPress={() => !disabled && onChange(!checked)}>
      <Slot width={BOX_SIZE} height={CAP_HEIGHT * LABEL_SIZE}>
        <Box
          width={BOX_SIZE}
          height={BOX_SIZE}
          y={-BOX_SIZE / 2}
          backgroundColor={checked ? "$primary" : "transparent"}
          borderColor={focusVisible ? "$color" : checked ? "$primary" : "$textFaint"}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-labelledby={labelId}
            style={HIDDEN_INPUT}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange(e.target.checked)}
            onFocus={(e) => setFocusVisible(e.target.matches(":focus-visible"))}
            onBlur={() => setFocusVisible(false)}
          />
          {checked && (
            <Check>
              <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d="M1.8 5.3 4 7.5 8.2 2.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Check>
          )}
        </Box>
      </Slot>
      <Label id={labelId} fontSize={LABEL_SIZE}>
        {label}
      </Label>
    </Row>
  );
}
