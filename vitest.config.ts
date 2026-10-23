import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Two Storybook/axe projects (one per pinned toolbar theme) plus a jsdom unit
// project. `__BOBUTTONS_A11Y_CONTRAST__` (read by .storybook/preview.tsx)
// enables axe's color-contrast rule for "storybook-jade" only.
export default defineConfig({
  // @tamagui/core reads `process.env.NODE_ENV` at module load, and the browser
  // projects have no Node `process`. Pinned to "development", not "test":
  // @tamagui/web's invalid-token diagnostics only run when it is exactly
  // "development", and src/test/no-tamagui-warnings.setup.ts relies on them.
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
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook"), initialGlobals: { theme: "jade" } })],
        test: {
          name: "storybook-jade",
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
