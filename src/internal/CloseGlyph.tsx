import * as React from "react";

/**
 * A close "x" drawn as an SVG, so it is centred in its box whatever the font.
 * A text "×" sits wherever the font puts it, which rarely lines up with
 * neighbouring text. Inherits the surrounding text colour.
 */
export function CloseGlyph(): React.ReactElement {
  return (
    <svg width="0.65em" height="0.65em" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
