import { defineConfig } from "tsup";

// Dual ESM + CJS build. @tamagui/* is bundled into dist, so it stays a
// devDependency: @tamagui/core transitively requires a react-native-web peer
// that must not reach consumers. react / react-dom are external peers.
//
// Declarations come from `tsc --emitDeclarationOnly` (tsconfig.build.json), not
// tsup, whose bundler re-exports `@tamagui/*` types into the public `.d.ts`.
//
// Leave `conditions` and `platform` at web defaults: resolving the
// `react-native` condition or `.native.js` would pull react-native into dist.
export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  platform: "browser",
  target: "es2022",
  outDir: "dist",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".mjs" };
  },
  dts: false,
  sourcemap: false,
  clean: true,
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime"],
  skipNodeModulesBundle: false,
});
