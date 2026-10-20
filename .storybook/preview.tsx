import * as React from "react";
import type { Preview } from "@storybook/react-vite";
import { BobuttonsProvider } from "../src/provider/BobuttonsProvider.js";
import { themeNames } from "../src/tamagui.config.js";

// Vite `define` compile-time constant, set per Vitest project in
// vitest.config.ts; see the a11y.config.rules usage below.
declare const __BOBUTTONS_A11Y_CONTRAST__: boolean | undefined;

// AC9: a toolbar control that can switch every one of the nine themes.
// AC17: a fixed ISO instant is the global default for any story args that
// need "now" — no component reads the host clock directly.
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
    a11y: {
      // AC16: addon-a11y defaults parameters.a11y.test to "todo", which only
      // WARNS on a violation. "error" is required for a violation to
      // actually fail the Storybook/Vitest run (scripts/verify.mjs step 16).
      test: "error",
      // Colour contrast is gated on jade-aa only; every other theme is
      // exempt (out-of-scope list). `__BOBUTTONS_A11Y_CONTRAST__` is a Vite
      // `define` constant set per Vitest project in vitest.config.ts (true
      // only for the "storybook-jade-aa" project); `typeof` guards against
      // it being unset (e.g. plain `npm run storybook` dev builds), where it
      // correctly defaults to disabled.
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
        React.createElement(Story)
      );
    },
  ],
};

export default preview;
