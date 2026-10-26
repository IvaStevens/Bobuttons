import * as React from "react";
import { Pressable, TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from "react-native";
import { useCssColor } from "./cssColor.native.js";
import { touchHitSlop } from "./platformStyles.native.js";
import { fontFamilies } from "../tokens/fontFamilies.native.js";

// Mirrors TextInput.tsx's Frame `fontSize: "$7"` token (12px in
// src/tamagui.config.ts's FONT_SIZE_PX). A plain RN `TextInput` is not a
// Tamagui component and composes with a Tamagui `Text` parent only as an
// opaque child — React Native does not flow inherited text style into a
// child component the way a DOM `<input>` inherits `font`/`color` from its
// parent, so this value is named explicitly rather than assumed inherited.
// Update if TextInput.tsx's Frame fontSize token changes.
const TEXT_FIELD_FONT_SIZE = 12;

// Mirrors Checkbox.tsx's `BOX_SIZE` (14px, the painted checkbox box — update
// if that constant changes). Review round 3 (B2-AC20/D7) found this seam's
// previous `hitSlop={8}` grew the hit area to only 30dp (14 + 2*8), still
// short of Android's ~48dp minimum. A later review pass (finding 5) found
// that growing THIS Pressable's own hitSlop further cannot reach 48dp
// either: its immediate ancestor chain (Checkbox.tsx's 14x14 `Box` inside
// an 8.52px-tall `Slot`) is itself far smaller than 48dp, and Android's
// touch dispatch (ReactAndroid's `TouchTargetHelper`) rejects a touch point
// outside a PARENT's own bounds before it ever reaches the child — so any
// `hitSlop` value here is clipped to that tiny ancestor chain. The real
// growth to 48dp happens one level up, on Checkbox.tsx's `Row` (which has
// room and already carries its own `onPress`); the modest value kept below
// is harmless best-effort coverage for whatever of the ancestor chain isn't
// clipped, not the thing that gets this control to 48dp.
const CHECKBOX_BOX_SIZE = 14;

export interface TextFieldProps {
  kind?: "text" | "checkbox";
  type?: "text" | "email" | "password" | "url" | "number";
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  /** Web-only (CSS reset for the bare `<input>`). Unused on native. */
  style?: unknown;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  onChangeText?: (value: string) => void;
  onChangeChecked?: (checked: boolean) => void;
  onSubmitEditing?: () => void;
  onFocusChange?: (focused: boolean, visible: boolean) => void;
  onPressStop?: () => void;
}

// B2-AC5(d): Android IME/text-input capability mapping for every `type`.
// autoCorrect/autoCapitalize have no platform-neutral prop (the web half
// relies on the browser's own defaults via `spellCheck={false}` plus no
// `autoCapitalize` attribute); they are applied here as documented native
// defaults rather than exposed as new public props. `secureTextEntry`'s web
// analogue (`type="password"`) is handled below; `returnKeyType` maps the
// Enter-to-submit behaviour `onEnter` already has on web. `multiline` is
// declared NOT supported by this ticket (README B2-AC5(d)) — there is no
// code path for it on either platform, by design, not by omission.
function keyboardTypeFor(type: TextFieldProps["type"]): RNTextInputProps["keyboardType"] {
  if (type === "email") return "email-address";
  if (type === "url") return "url";
  if (type === "number") return "numeric";
  // eslint-disable-next-line bobuttons/no-raw-style-literals -- RN's keyboardType value "default", not a Tamagui theme name
  return "default";
}

export function TextField(props: TextFieldProps): React.ReactElement {
  const { kind = "text", type = "text", value, checked, disabled, placeholder, onChangeText, onChangeChecked, onSubmitEditing, onFocusChange, onPressStop } = props;
  // Unconditional (hooks can't be called conditionally): resolves theme
  // tokens to concrete values on native, exactly like every other seam that
  // reads a theme colour (B2-AC12). Unused for kind="checkbox".
  const toCss = useCssColor();

  if (kind === "checkbox") {
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: Boolean(checked), disabled: Boolean(disabled) }}
        disabled={disabled}
        hitSlop={touchHitSlop(CHECKBOX_BOX_SIZE, CHECKBOX_BOX_SIZE)}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        onPress={() => {
          onPressStop?.();
          onChangeChecked?.(!checked);
        }}
        onFocus={() => onFocusChange?.(true, true)}
        onBlur={() => onFocusChange?.(false, false)}
      />
    );
  }

  return (
    <RNTextInput
      // React Native does not inherit a parent Text's colour/font/size into
      // a child TextInput (review finding: this used to render completely
      // unstyled, in the platform default face/colour/size regardless of
      // theme). Resolved the same way every other themed seam resolves a
      // colour on native — through useCssColor, never a `var(--token)`
      // string — mirroring TextInput.tsx's Frame (`color: "$color"`,
      // `fontSize: "$7"`) and its native `::placeholder` equivalent
      // (`color: var(--textFaint)` on web). Always uses the body face
      // (fontFamilies.body), never the mono one: TextInput's `mono` variant
      // is a web/Frame-only visual today and is not threaded through this
      // seam, to avoid adding a prop to the shared type surface for a single
      // native-only font-family choice — named as an accepted divergence in
      // the README's B2-AC5(c) list rather than built, since the alternative
      // (forwarding `mono` through TextField) would also touch the SHARED
      // TextInput.tsx/TextField.tsx files and move web bundle bytes for a
      // native-only concern.
      style={{ flex: 1, minWidth: 0, width: "100%", padding: 0, color: toCss("$color"), fontFamily: fontFamilies.body, fontSize: TEXT_FIELD_FONT_SIZE }}
      placeholderTextColor={toCss("$textFaint")}
      value={value}
      editable={!disabled}
      placeholder={placeholder}
      keyboardType={keyboardTypeFor(type)}
      secureTextEntry={type === "password"}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="done"
      accessibilityLabel={props["aria-label"]}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      onFocus={() => onFocusChange?.(true, true)}
      onBlur={() => onFocusChange?.(false, false)}
    />
  );
}
