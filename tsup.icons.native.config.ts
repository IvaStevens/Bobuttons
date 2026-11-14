import { defineConfig } from "tsup";
import { nativeResolvePlugin } from "./scripts/esbuild-native-resolve.js";

// Native pack build: four independent entries -> dist/icons/<pack>.native.js.
// Mirrors tsup.native.config.ts's resolution setup (conditions/mainFields/
// resolveExtensions so each pack's `foo.native.ts(x)` seam siblings resolve
// at build time) but deliberately reuses ONLY `nativeResolvePlugin` —
// `staticUsePressabilityPlugin` is a @tamagui/web-specific rewrite that has
// nothing to do with icon packs and must not be reused here. `react-native-
// svg` is external (an optional peer, never bundled). `clean: false` /
// `splitting: false` for the same reasons as tsup.icons.config.ts.
export default defineConfig({
  entry: {
    "icons/animal.native": "src/icons/animal.ts",
    "icons/basic.native": "src/icons/basic.ts",
    "icons/food.native": "src/icons/food.ts",
    "icons/shapes.native": "src/icons/shapes.ts",
  },
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
  external: ["react", "react/jsx-runtime", "react-native-svg"],
  skipNodeModulesBundle: false,
  esbuildPlugins: [nativeResolvePlugin],
  esbuildOptions(options) {
    options.conditions = ["react-native"];
    options.mainFields = ["react-native", "module", "main"];
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
