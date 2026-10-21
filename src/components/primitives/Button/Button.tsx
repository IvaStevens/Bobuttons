import * as React from "react";
import { styled, Text, View } from "@tamagui/core";
import { activationKeyHandlers } from "../../../internal/interaction.js";

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
  // Sizes to the label; plain `flex` stretches to a block parent's full width.
  display: "inline-flex",

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
        cursor: "not-allowed",
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
  const [interaction, setInteraction] = React.useState<"hover" | "press" | "focus" | undefined>(undefined);

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
      variant={variant === "primary" ? undefined : variant}
      disabled={disabled}
      {...interactionStyle}
      onPress={fire}
      onMouseEnter={() => !disabled && setInteraction("hover")}
      onMouseLeave={() => setInteraction(undefined)}
      onMouseDown={() => !disabled && setInteraction("press")}
      onMouseUp={() => !disabled && setInteraction("hover")}
      onFocus={() => !disabled && setInteraction((prev) => prev ?? "focus")}
      onBlur={() => setInteraction(undefined)}
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
