import * as React from "react";

/**
 * Web half of the input-element seam, shared by TextInput (a visible text
 * entry) and Checkbox (a visually-hidden toggle kept for native keyboard and
 * screen-reader behaviour). `kind` selects which bare `<input>` this
 * renders; both are byte-equivalent to what TextInput.tsx/Checkbox.tsx
 * inlined before this seam existed (B2-AC11).
 */
export interface TextFieldProps {
  kind?: "text" | "checkbox";
  /** Only meaningful for `kind: "text"`. */
  type?: "text" | "email" | "password" | "url" | "number";
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  style?: React.CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  onChangeText?: (value: string) => void;
  onChangeChecked?: (checked: boolean) => void;
  /** Fires on Enter (text) — the B2-AC5(d) cross-platform "submit" mapping. */
  onSubmitEditing?: () => void;
  /** `visible` is only meaningful on web (`:focus-visible`); always `true` on native. */
  onFocusChange?: (focused: boolean, visible: boolean) => void;
  /** Checkbox only: stops the click reaching the row's own `onPress`. */
  onPressStop?: () => void;
}

// Strips the web `<input>` bare so it inherits TextInput's Frame font and
// colour. Byte-for-byte what TextInput.tsx inlined before this seam existed.
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

export function TextField(props: TextFieldProps): React.ReactElement {
  const {
    kind = "text",
    type = "text",
    value,
    checked,
    disabled,
    placeholder,
    min,
    max,
    style,
    onChangeText,
    onChangeChecked,
    onSubmitEditing,
    onFocusChange,
    onPressStop,
    ...rest
  } = props;

  if (kind === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onPressStop?.();
        }}
        onChange={(e) => onChangeChecked?.(e.target.checked)}
        onFocus={(e) => onFocusChange?.(true, e.target.matches(":focus-visible"))}
        onBlur={() => onFocusChange?.(false, false)}
        {...rest}
      />
    );
  }

  return (
    <input
      data-bobuttons-input=""
      style={{ ...BARE_INPUT, ...style }}
      type={type}
      value={value}
      placeholder={placeholder}
      min={min}
      max={max}
      autoComplete={type === "password" ? "new-password" : "off"}
      spellCheck={false}
      onChange={(e) => onChangeText?.(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmitEditing?.();
      }}
      onFocus={() => onFocusChange?.(true, true)}
      onBlur={() => onFocusChange?.(false, false)}
      {...rest}
    />
  );
}
