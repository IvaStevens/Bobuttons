import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// AC16: two Storybook/axe projects (docs/context §C3) plus a plain jsdom
// unit-test project for library-internal tests like the AC9 remount
// regression test. `storybookTest()`'s `initialGlobals` pins the toolbar
// theme per project without touching the shared `.storybook/preview.tsx`
// (that option exists for exactly this: "define one Vitest project per
// theme, each with a different value").
//
// The two Storybook projects differ in a SECOND way beyond the toolbar
// theme: each defines `__BOBUTTONS_A11Y_CONTRAST__` (a Vite `define`
// compile-time constant, read by .storybook/preview.tsx) to turn axe's
// color-contrast rule on for "storybook-jade-aa" only, per AC16 ("Colour
// contrast is additionally gated on jade-aa only; all other themes are
// exempt"). This was previously a known gap — both projects shared the same
// static ruleset from preview.tsx with contrast always disabled.
export default defineConfig({
  // @tamagui/core reads `process.env.NODE_ENV` at module load; the Storybook
  // browser-mode projects below run in a real browser with no Node `process`
  // global, so it must be statically replaced.
  //
  // Pinned to "development", not "test": @tamagui/web's invalid-token
  // diagnostics (getSplitStyles.tsx, the exact check that would have caught
  // the shipped `borderColor: "$border"` typo — review finding, high) are
  // gated on `process.env.NODE_ENV === 'development'` specifically, not the
  // broader `!== 'production'` that React's own dev-mode checks use. "test"
  // silently skipped that whole diagnostic branch, which is why
  // src/test/no-tamagui-warnings.setup.ts never caught anything.
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        define: {
          __BOBUTTONS_A11Y_CONTRAST__: JSON.stringify(false),
        },
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook"), initialGlobals: { theme: "default" } })],
        test: {
          name: "storybook-default",
          setupFiles: ["./src/test/no-tamagui-warnings.setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        extends: true,
        define: {
          __BOBUTTONS_A11Y_CONTRAST__: JSON.stringify(true),
        },
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook"), initialGlobals: { theme: "jade-aa" } })],
        test: {
          name: "storybook-jade-aa",
          setupFiles: ["./src/test/no-tamagui-warnings.setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
