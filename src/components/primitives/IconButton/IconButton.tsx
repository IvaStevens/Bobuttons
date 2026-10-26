import * as React from "react";
import { CloseGlyph } from "../../../internal/CloseGlyph.js";
import { activationKeyHandlers, useInteractive } from "../../../internal/interaction.js";
import { Frame, INLINE_FLEX, touchHitSlop } from "../../../internal/platformStyles.js";
import { useCssColor } from "../../../internal/cssColor.js";

// B2-AC20/D7 touch-target seam (see the `hitSlop` prop below): painted box
// estimated from Frame's own tokens — fontSize "$13" (16px, FONT_SIZE_PX[13]
// in tamagui.config.ts) for both the glyph's em-box and the line height,
// plus paddingHorizontal "$1" (4px, space[1] in src/tokens/space.ts) on
// each side, giving 16 + 4*2 = 24 wide, 16 tall (no vertical padding).
// `Frame` itself now lives in src/internal/platformStyles.ts(x) (review
// round 4, finding 1) rather than this file, deliberately reusing that
// existing seam instead of a new one — the web export below is
// byte-for-byte what the old local `Frame` definition here was (B2-AC11);
// the native export is a View-based press target instead of the
// Text-based one this control used before, because Android's hit-area
// growth (`hitSlop`, below) is honoured only on a View, not a Text host.

export interface IconButtonProps {
  /** Accessible name; the visual is icon-only. */
  label: string;
  /** The glyph or Icon to show. Defaults to a close "x". */
  children?: React.ReactNode;
  onPress?: () => void;
  /** "danger" highlights on hover, for destructive actions. */
  tone?: "neutral" | "danger";
  disabled?: boolean;
}

export function IconButton(props: IconButtonProps): React.ReactElement {
  const { label, children, onPress, tone = "neutral", disabled = false } = props;
  const { hovered, pressed, handlers } = useInteractive();
  const highlighted = hovered || pressed;
  const fire = () => {
    if (!disabled) onPress?.();
  };
  const hoverColor = tone === "danger" ? "$slaRed" : "$color";
  const toCss = useCssColor();
  const resolvedColor = highlighted && !disabled ? hoverColor : "$textDim";

  return (
    <Frame
      {...INLINE_FLEX}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      color={resolvedColor}
      opacity={disabled ? 0.5 : 1}
      hitSlop={touchHitSlop(24, 16)}
      onPress={fire}
      {...handlers}
      {...activationKeyHandlers(fire)}
    >
      {children ?? <CloseGlyph color={toCss(resolvedColor)} />}
    </Frame>
  );
}
