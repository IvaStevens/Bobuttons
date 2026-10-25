import { defineConfig } from "tsup";
import { nativeResolvePlugin } from "./scripts/esbuild-native-resolve.js";

// Native build: src/index.ts -> dist/index.native.js. ESM only (D9: no
// dist/index.native.cjs — metro's default sourceExts are exactly
// ["js","jsx","json","ts","tsx"], so a .cjs/.mjs native entry would never
// resolve; the one-line consumer-Jest transformIgnorePatterns caveat this
// implies is documented in the README).
//
// `platform: "neutral"` plus the esbuild-level `conditions`/`mainFields`/
// `resolveExtensions` below are what make the bundler-resolved-at-build-time
// seam (foo.native.ts(x) beside foo.ts(x)) resolve to the native half without
// an index.native.ts or an exports subpath. tsup.config.ts (the web build) is
// deliberately untouched: its own comment about keeping conditions/platform
// at web defaults stays correct, and leaving it alone is what keeps
// dist/index.mjs and dist/index.cjs byte-identical to `main` (B2-AC11).
//
// `clean: false` is load-bearing: tsup.config.ts (web) runs first with
// `clean: true`, and scripts/build.mjs relies on this build running AFTER it
// without deleting dist/index.mjs / dist/index.cjs.
export default defineConfig({
  entry: { "index.native": "src/index.ts" },
  format: ["esm"],
  platform: "neutral",
  target: "es2022",
  outDir: "dist",
  outExtension() {
    return { js: ".js" };
  },
  dts: false,
  sourcemap: false,
  clean: false,
  splitting: false,
  // react-native is external (a peer, never bundled); @tamagui/core stays
  // bundled, same as the web build.
  external: ["react", "react/jsx-runtime", "react-native"],
  skipNodeModulesBundle: false,
  esbuildPlugins: [nativeResolvePlugin],
  esbuildOptions(options) {
    options.conditions = ["react-native"];
    options.mainFields = ["react-native", "module", "main"];
    // Still set for completeness/for any EXTENSIONLESS specifier esbuild
    // resolves on its own (e.g. inside a dependency); our own source's
    // explicit ".js" specifiers are handled by nativeResolvePlugin above,
    // since resolveExtensions does not apply to specifiers that already
    // have an extension.
    options.resolveExtensions = [
      ".native.tsx",
      ".native.ts",
      ".native.js",
      ".tsx",
      ".ts",
      ".js",
      ".mjs",
    ];
  },
});
