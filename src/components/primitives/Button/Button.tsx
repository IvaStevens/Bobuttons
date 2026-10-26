import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers, useButtonInteraction } from "../../../internal/interaction.js";
import { DISABLED_CURSOR, INLINE_FLEX } from "../../../internal/platformStyles.js";

// B2-AC20/D7 touch-target seam (review round 3, finding 1, resolved via
// finding 7's zero-web-byte mechanism — see the `useButtonInteraction` call
// below, not a `hitSlop` prop here): painted height from ButtonFrame's own
// tokens — paddingVertical "$2" (8px each side, space.ts) plus
// ButtonLabel's line height at fontSize "$7" (12px, FONT_SIZE_PX[7] in
// tamagui.config.ts) rounded at the body font's 1.4 line-height multiplier
// (round(12*1.4) = 17) plus borderWidth "$0.25" (1px each side) ->
// 8*2 + 17 + 1*2 = 35. Width is NOT grown: a short label's painted width
// varies with its text, which this seam can't know statically, and the
// finding's fix is scoped to the vertical shortfall only.
const BUTTON_HEIGHT = 35;

// Keep styled() results module-private and the props interface hand-written so
// the emitted .d.ts never references @tamagui/core.
const ButtonFrame = styled(View, {
  backgroundColor: "$primary",
  borderRadius: "$5",
  paddingVertical: "$2",
  paddingHorizontal: "$4",
  borderWidth: "$0.25", // 1px hairline
  borderColor: "$borderColor",
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",

  variants: {
    variant: {
      secondary: {
        backgroundColor: "$secondary",
      },
      ghost: {
        backgroundColor: "transparent",
        borderColor: "$borderColor",
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },
  } as const,
});

// Per-variant hover/press/focus feedback, applied as style overrides from local
// state. Filled variants change the border only: the `*Dim`/`*Glow` tokens are
// low-alpha, so swapping the fill lets the page show through and breaks label
// contrast. `ghost` has no fill and swaps to a solid surface step instead.
const INTERACTION_BACKGROUND: Record<"primary" | "secondary" | "ghost", Partial<Record<"hover" | "press", string>>> = {
  primary: {},
  secondary: {},
  ghost: { hover: "$surface", press: "$surface2" },
};
const INTERACTION_BORDER: Record<"primary" | "secondary" | "ghost", Record<"hover" | "press" | "focus", string>> = {
  primary: { hover: "$primaryDim", press: "$primaryGlow", focus: "$primary" },
  secondary: { hover: "$secondaryDim", press: "$secondaryGlow", focus: "$secondary" },
  ghost: { hover: "$primary", press: "$primary", focus: "$primary" },
};

// Filled variants use `$background` for the label so it contrasts with the
// fill; `$color` is designed against the page background. `ghost` has no fill
// and keeps `$color`.
const ButtonLabel = styled(Text, {
  color: "$background",
  // Bare font key, not "$body": @tamagui/core looks fontFamily up in
  // `fontsParsed` by key, so "$body" silently falls back to the UA font.
  fontFamily: "body",
  fontSize: "$7",

  variants: {
    variant: {
      ghost: { color: "$color" },
    },
  } as const,
});

export interface ButtonProps {
  /** Visible label. */
  label: string;
  /** Visual style. Defaults to the primary token. */
  variant?: "primary" | "secondary" | "ghost";
  /** Disables interaction and dims the button. */
  disabled?: boolean;
  onPress?: () => void;
  "aria-label"?: string;
}

/** Presentational-only primitive: props in, callback out. */
export function Button(props: ButtonProps): React.ReactElement {
  const { label, variant = "primary", disabled = false, onPress, ...rest } = props;
  // Own combined interaction state (press > hover > focus) via
  // useButtonInteraction, so a mouse leave clears a stale focus ring too (B2-AC11).
  // The height arg carries the B2-AC20/D7 touch-target growth through `handlers`
  // on native (see interaction.native.ts); ignored on web, no new web bytes.
  const { interaction, handlers } = useButtonInteraction({ height: BUTTON_HEIGHT });

  const interactionBg = !disabled && interaction && interaction !== "focus" ? INTERACTION_BACKGROUND[variant][interaction] : undefined;
  const interactionBorder = !disabled && interaction ? INTERACTION_BORDER[variant][interaction] : undefined;

  const fire = () => {
    if (!disabled) onPress?.();
  };

  // Spread only when set: Tamagui treats an explicit `undefined` as an
  // override and would erase the variant's fill and border.
  const interactionStyle = {
    ...(interactionBg ? { backgroundColor: interactionBg } : null),
    ...(interactionBorder ? { borderColor: interactionBorder } : null),
  };

  return (
    <ButtonFrame
      {...INLINE_FLEX}
      {...(disabled ? DISABLED_CURSOR : null)}
      variant={variant === "primary" ? undefined : variant}
      disabled={disabled}
      {...interactionStyle}
      onPress={fire}
      {...handlers}
      {...activationKeyHandlers(fire)}
      aria-label={rest["aria-label"] ?? label}
      aria-disabled={disabled || undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <ButtonLabel variant={variant === "primary" ? undefined : variant}>{label}</ButtonLabel>
    </ButtonFrame>
  );
}
