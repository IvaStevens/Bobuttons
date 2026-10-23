import * as React from "react";
import { styled, Text } from "@tamagui/core";

// The frame carries the visuals; the native <input> inside is stripped bare so
// it inherits the frame's font and colour.
const Frame = styled(Text, {
  display: "inline-flex",
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

const BARE_INPUT: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  width: "100%",
  padding: 0,
  border: 0,
  outline: "none",
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

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
      fill={fill}
      compact={compact}
      mono={mono}
      borderColor={focused ? "$primary" : saved ? "$statusInvestigated" : "$borderColor"}
    >
      <input
        data-bobuttons-input=""
        style={BARE_INPUT}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        aria-label={props["aria-label"]}
        autoComplete={type === "password" ? "new-password" : "off"}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter?.();
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </Frame>
  );
}
