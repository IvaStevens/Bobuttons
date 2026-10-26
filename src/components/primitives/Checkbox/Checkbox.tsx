import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { INLINE_FLEX, touchHitSlop } from "../../../internal/platformStyles.js";
import { TextField } from "../../../internal/TextField.js";
import { CheckGlyph } from "../../../internal/CheckGlyph.js";
import { useCssColor } from "../../../internal/cssColor.js";

// Sizes the layout is built from. The box is centred on the label's cap height,
// measured up from its baseline, so these are numbers rather than tokens.
const LABEL_SIZE = 12;
const BOX_SIZE = 14;
// Cap height as a fraction of font size; close to 0.7 across common UI fonts.
const CAP_HEIGHT = 0.71;

// B2-AC20/D7 touch-target seam (review round 3, finding 4 — see the
// `hitSlop` prop on Row below). Review finding 5 found that growing the
// hit area on TextField.native.tsx's own checkbox `Pressable` cannot reach
// 48dp on Android: that Pressable's immediate ancestor chain (a 14x14 `Box`
// inside an 8.52px-tall `Slot`) is itself far smaller than 48dp, and
// Android's touch dispatch (ReactAndroid's `TouchTargetHelper`) rejects a
// touch point outside a PARENT's own bounds before it ever reaches the
// child — so a `hitSlop` on that Pressable is clipped to its tiny ancestor
// chain regardless of how large a value it asks for. `Row` is the ancestor
// that actually has room (it already carries its own `onPress`, baseline
// alignment, "$1.5" gap, and spans the checkbox's full clickable width), so
// the real growth to 48dp happens here instead. Row's painted height is
// baseline-aligned and dominated by `Label`'s line height at LABEL_SIZE=12
// (`round(12*1.4) = 17`, the body font's 1.4 line-height multiplier in
// tamagui.config.ts) — taller than the box/slot, so that is the number to
// grow from.
const ROW_HEIGHT = 17;

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
  color: "$background",
});

const Label = styled(Text, {
  fontFamily: "body",
  color: "$textDim",
});

// Fills the box, invisible but still focusable and clickable (web only;
// TextField.native's checkbox branch covers its own hit area).
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
  const toCss = useCssColor();

  return (
    <Row
      opacity={disabled ? 0.5 : 1}
      hitSlop={touchHitSlop(undefined, ROW_HEIGHT)}
      onPress={() => !disabled && onChange(!checked)}
    >
      <Slot width={BOX_SIZE} height={CAP_HEIGHT * LABEL_SIZE}>
        <Box
          width={BOX_SIZE}
          height={BOX_SIZE}
          y={-BOX_SIZE / 2}
          backgroundColor={checked ? "$primary" : "transparent"}
          borderColor={focusVisible ? "$color" : checked ? "$primary" : "$textFaint"}
        >
          <TextField
            kind="checkbox"
            checked={checked}
            disabled={disabled}
            aria-labelledby={labelId}
            style={HIDDEN_INPUT}
            onChangeChecked={onChange}
            onFocusChange={(focused, visible) => setFocusVisible(focused && visible)}
          />
          {checked && (
            <Check {...INLINE_FLEX}>
              <CheckGlyph color={toCss("$background")} />
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
