/* eslint-disable bobuttons/no-raw-style-literals -- fixed glyph geometry (an "x" drawn from two rotated bars) and its fallback colour, not a themeable UI value */
import * as React from "react";
import { View } from "react-native";

export interface CloseGlyphProps {
  color?: string;
}

/**
 * Native half: two rotated hairline Views instead of an SVG with `em`-unit
 * dimensions (`em` units do not exist on native; there is no
 * `react-native-svg` peer either). Fixed pixel size rather than
 * font-relative, which is the one visual approximation this glyph makes.
 * There is no native "currentColor"; the caller resolves and passes the
 * ambient text colour explicitly (see IconButton.tsx).
 */
export function CloseGlyph(props: CloseGlyphProps): React.ReactElement {
  const color = props.color ?? "#000";
  const size = 13;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          top: size / 2 - 1,
          left: 0,
          width: size,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size / 2 - 1,
          left: 0,
          width: size,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}
