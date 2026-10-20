import type { StorybookConfig } from "@storybook/react-vite";

// AC1/AC16: Storybook 10.6.2 + @storybook/react-vite + @storybook/addon-a11y.
// docs/context §C2/§B2: no Tamagui Vite plugin, no react-native export
// condition, no .native.js extension resolution — default web bundler
// behaviour keeps this config, and dist, clean.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: false,
  },
  // AC16 fix (review finding, high): do NOT define
  // `__BOBUTTONS_A11Y_CONTRAST__` here via `viteFinal`. `@storybook/addon-vitest`
  // calls this hook to build `viteConfigFromStorybook`, then returns
  // `mergeConfig(baseConfig, viteConfigFromStorybook)` from its own `config()`
  // plugin hook — so a define set here always wins over the per-project
  // `define: { __BOBUTTONS_A11Y_CONTRAST__: true }` set in
  // vitest.config.ts's "storybook-jade-aa" project, silently disabling the
  // contrast gate on every project (reproduced: a 1.02:1-contrast story
  // passed `storybook-jade-aa` while this override existed). Standalone
  // `npm run storybook` / `build-storybook` runs correctly fall back to
  // "disabled" via the `typeof __BOBUTTONS_A11Y_CONTRAST__ !== "undefined"`
  // guard in `.storybook/preview.tsx` — no define needed here at all.
};

export default config;
