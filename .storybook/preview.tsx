import * as React from "react";
import type { Preview } from "@storybook/react-vite";
import { View } from "@tamagui/core";
import { BobuttonsProvider } from "../src/provider/BobuttonsProvider.js";
import { themeNames } from "../src/tamagui.config.js";

// Vite `define` constant set per Vitest project in vitest.config.ts.
declare const __BOBUTTONS_A11Y_CONTRAST__: boolean | undefined;

// Fixed "now" for stories; components never read the host clock.
export const FIXED_NOW = "2026-10-19T12:00:00.000Z";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Bobuttons theme",
      toolbar: {
        icon: "paintbrush",
        items: themeNames.map((name) => ({ value: name, title: name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "default",
  },
  parameters: {
    // The decorator paints `$background` edge to edge; padding would leave a frame.
    layout: "fullscreen",
    a11y: {
      test: "error",
      // Colour contrast is gated on jade only.
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: typeof __BOBUTTONS_A11Y_CONTRAST__ !== "undefined" && __BOBUTTONS_A11Y_CONTRAST__,
          },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "default";
      return React.createElement(
        BobuttonsProvider,
        { theme },
        React.createElement(
          View,
          {
            backgroundColor: "$background",
            minHeight: "100vh",
            padding: context.parameters.fullBleed ? 0 : "$4",
          },
          React.createElement(Story)
        )
      );
    },
  ],
};

export default preview;
