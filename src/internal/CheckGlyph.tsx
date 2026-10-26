import * as React from "react";

export interface CheckGlyphProps {
  /** Ignored on web (inherits `currentColor`); required for the native View-based tick. */
  color?: string;
}

/**
 * Web half: the inline SVG tick, extracted from Checkbox.tsx unchanged
 * (B2-AC11). Inherits the surrounding text colour via `currentColor`.
 */
export function CheckGlyph(_props: CheckGlyphProps): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M1.8 5.3 4 7.5 8.2 2.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
