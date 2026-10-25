/* eslint-disable bobuttons/no-raw-style-literals -- fixed glyph geometry (a tick drawn from two rotated bars) and its fallback colour, not a themeable UI value */
import * as React from "react";
import { View } from "react-native";

export interface CheckGlyphProps {
  color?: string;
}

/**
 * Native half: the tick as two rotated hairline Views instead of an inline
 * SVG — there is no `react-native-svg` peer, and `griddy-icons`' DOM SVG
 * components cannot render on native under any peer anyway (B2-AC18), so
 * this library draws its own small glyphs for the handful it owns.
 */
export function CheckGlyph(props: CheckGlyphProps): React.ReactElement {
  const color = props.color ?? "#000";
  return (
    <View style={{ width: 12, height: 12 }}>
      <View
        style={{
          position: "absolute",
          left: 1,
          top: 5,
          width: 5,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 3,
          top: 2,
          width: 8,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
    </View>
  );
}
