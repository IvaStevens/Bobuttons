import * as React from "react";
import { styled, Text, View } from "@tamagui/core";

// docs/context §C1 (load-bearing for AC15/F1): the styled() result stays
// module-private — it is never exported, and the public props interface
// below is hand-written rather than inferred, so the emitted .d.ts never
// references @tamagui/core.
const ButtonFrame = styled(View, {
  backgroundColor: "$primary",
  borderRadius: "$5",
  paddingVertical: "$2",
  paddingHorizontal: "$4",
  borderWidth: "$0.25", // hairline: space token 0.25 == 1px (src/tamagui.config.ts)
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
        cursor: "not-allowed",
        pointerEvents: "none",
      },
    },
  } as const,
});

// Hover/focus/press feedback is computed per-variant from local React state
// (see Button(), below) and applied as a direct style-prop override, rather
// than a Tamagui `interaction` variant — review finding (low): a single
// hardcoded-to-primary `interaction` variant tinted secondary/ghost buttons
// with the primary (teal) colour on hover/focus regardless of `variant`.
// Tokens only, never a raw colour (AC7); no theme-name branch (AC6).
//
// Review finding (high, AC16): `primary`/`secondary` are FILLED variants
// whose label colour (`$background`) is only guaranteed to contrast against
// the SOLID `$primary`/`$secondary` fill. The `*Dim`/`*Glow` tokens are
// low-alpha (e.g. jade-aa `primaryDim` is `rgba(90,176,170,0.18)`) and are
// designed to be composited as a subtle tint over a surface elsewhere in the
// source apps — swapping the button's own opaque background for one of them
// on hover let the page background show through and collapsed the label's
// contrast to 1.31:1 (measured, reproduced via the Interactive story's play
// function leaving the button in its "hover" state for the AC16 check).
// Filled variants therefore get hover/press feedback from the BORDER only,
// never the fill, so the solid background — and the label contrast measured
// against it — never changes. `ghost` has no fill to protect and keeps a
// solid (non-alpha) background swap, using the `$surface`/`$surface2` steps.
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

// AC16 fix (review finding, high): the label sits on a FILLED background for
// `primary`/`secondary` (teal/red), so it must use a token that contrasts
// against that fill rather than the theme's body-text colour (`$color`,
// designed against `$background`) — measured 1.40-2.08:1 on jade-aa before
// this fix, now `$background` against `$primary`/`$secondary` measures
// 7.60:1 / 5.67:1. `ghost` has no fill (transparent), so it keeps `$color`
// against the real page background (see BobuttonsProvider's canvas paint).
const ButtonLabel = styled(Text, {
  color: "$background",
  // Review finding (high, AC7): this was "$body" — fontFamily tokens in
  // @tamagui/core are looked up by the BARE font key ("body"), not the `$`
  // token syntax used for colour/space/size props; "$body" never matches
  // `conf.fontsParsed` so no `font_body` class was ever applied and the
  // label silently fell back to the UA default (verified: axe measured 16px
  // instead of the intended 12px). Re-verified by probe: `fontFamily="body"`
  // emits `class="... font_body ..."`, `fontFamily="$body"` does not.
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

/**
 * Presentational-only primitive: props in, callback out. Placeholder-grade
 * (AC2: still exports its real props interface and renders every prop it
 * declares — see Button.stories.tsx for the args-coverage proxy, N7).
 */
export function Button(props: ButtonProps): React.ReactElement {
  const { label, variant = "primary", disabled = false, onPress, ...rest } = props;
  const [interaction, setInteraction] = React.useState<"hover" | "press" | "focus" | undefined>(undefined);

  const interactionBg = !disabled && interaction && interaction !== "focus" ? INTERACTION_BACKGROUND[variant][interaction] : undefined;
  const interactionBorder = !disabled && interaction ? INTERACTION_BORDER[variant][interaction] : undefined;

  const fire = () => {
    if (!disabled) onPress?.();
  };

  return (
    <ButtonFrame
      variant={variant === "primary" ? undefined : variant}
      disabled={disabled}
      backgroundColor={interactionBg}
      borderColor={interactionBorder}
      onPress={fire}
      onMouseEnter={() => !disabled && setInteraction("hover")}
      onMouseLeave={() => setInteraction(undefined)}
      onMouseDown={() => !disabled && setInteraction("press")}
      onMouseUp={() => !disabled && setInteraction("hover")}
      onFocus={() => !disabled && setInteraction((prev) => prev ?? "focus")}
      onBlur={() => setInteraction(undefined)}
      // Review finding (medium): a `role="button"` div is not keyboard
      // operable by default — browsers only synthesise a click from Enter/
      // Space for native interactive elements. These two handlers replicate
      // native <button> activation (Enter fires on keydown; Space fires on
      // keyup, matching the browser default, and is prevented on keydown so
      // it does not also scroll the page).
      onKeyDown={(e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter") {
          e.preventDefault();
          fire();
        } else if (e.key === " ") {
          e.preventDefault();
        }
      }}
      onKeyUp={(e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === " ") {
          e.preventDefault();
          fire();
        }
      }}
      aria-label={rest["aria-label"] ?? label}
      // Review finding (low): the disabled state was visual-only (opacity +
      // pointerEvents), so assistive tech announced the Disabled story as an
      // ordinary, enabled button.
      aria-disabled={disabled || undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <ButtonLabel variant={variant === "primary" ? undefined : variant}>{label}</ButtonLabel>
    </ButtonFrame>
  );
}
