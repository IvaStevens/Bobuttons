import * as React from "react";
import { styled, Text } from "@tamagui/core";
import { INLINE_FLEX } from "../../../internal/platformStyles.js";
import { TextField } from "../../../internal/TextField.js";

// The frame carries the visuals; the web `<input>` inside is stripped bare so
// it inherits the frame's font and colour (B2-AC12: the shared path never
// sees that `React.CSSProperties` bag — it now lives in TextField.tsx).
const Frame = styled(Text, {
  alignItems: "center",
  width: "$inputWidth",
  paddingVertical: "$1.5",
  paddingHorizontal: "$2.5",
  backgroundColor: "$surface2",
  borderWidth: "$0.25",
  borderColor: "$borderColor",
  borderRadius: "$3",
  fontFamily: "body",
  fontSize: "$7",
  color: "$color",

  variants: {
    fill: { true: { flex: 1, width: "auto" } },
    compact: { true: { width: "$inputWidthCompact" } },
    mono: { true: { fontFamily: "mono" } },
  } as const,
});

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "url" | "number";
  /** Stretch to the available width instead of the default fixed width. */
  fill?: boolean;
  /** Narrow width, for short numeric values. */
  compact?: boolean;
  /** Monospace font. */
  mono?: boolean;
  /** Marks the value as saved with a coloured border. */
  saved?: boolean;
  /** Called when Enter is pressed. */
  onEnter?: () => void;
  min?: number;
  max?: number;
  "aria-label"?: string;
}

export function TextInput(props: TextInputProps): React.ReactElement {
  const { value, onChange, placeholder, type = "text", fill, compact, mono, saved, onEnter, min, max } = props;
  const [focused, setFocused] = React.useState(false);

  return (
    <Frame
      {...INLINE_FLEX}
      fill={fill}
      compact={compact}
      mono={mono}
      borderColor={focused ? "$primary" : saved ? "$statusInvestigated" : "$borderColor"}
    >
      <TextField
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        aria-label={props["aria-label"]}
        onChangeText={onChange}
        onSubmitEditing={onEnter}
        onFocusChange={(f) => setFocused(f)}
      />
    </Frame>
  );
}
