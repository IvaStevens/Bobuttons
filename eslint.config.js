import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import noRawStyleLiterals from "./eslint-rules/no-raw-style-literals.js";
import noImplicitIntl from "./eslint-rules/no-implicit-intl.js";

const bobuttonsRules = {
  rules: {
    "no-raw-style-literals": noRawStyleLiterals,
    "no-implicit-intl": noImplicitIntl,
  },
};

export default [
  {
    // Generated files are owned by scripts/generate-themes.mjs (docs/context
    // §N6.5) — no formatter or linter may reformat them, or a tool version
    // bump reports drift that is not drift.
    ignores: [
      "dist/**",
      "storybook-static/**",
      "node_modules/**",
      ".verify-out/**",
      "src/themes/themes.generated.ts",
      "src/themes/themes.source.css",
      "scripts/scratch-consumer/node_modules/**",
      "scripts/scratch-consumer/dist/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      bobuttons: bobuttonsRules,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // AC7 / AC6 / AC17: no raw px/colour literal, no theme-name branch, no
    // implicit Intl under src/components. src/tamagui.config.ts is the one
    // exemption (it IS the token scale) and is covered by the separate glob
    // below instead of this one.
    files: ["src/components/**/*.{ts,tsx}"],
    plugins: {
      bobuttons: bobuttonsRules,
    },
    rules: {
      "bobuttons/no-raw-style-literals": "error",
      "bobuttons/no-implicit-intl": "error",
    },
  },
  {
    // Review finding (low): with no rule block at all for .mjs/.js, `npx
    // eslint .` could not catch anything in the ~10 scripts that now
    // constitute the verify gate itself, or in the custom rule files (the
    // unused `distsize` variable fixed above slipped through exactly this
    // gap). Plain ESM, no TypeScript parser needed.
    files: ["scripts/**/*.mjs", "eslint-rules/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "error",
    },
  },
];
