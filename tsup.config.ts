import { defineConfig } from "tsup";

// Dual ESM + CJS build. @tamagui/* is bundled into dist (it is a devDependency,
// never a runtime dependency — see docs/context §F6: @tamagui/core's transitive
// @tamagui/react-native-media-driver declares a non-optional react-native-web
// peer, so Tamagui must never appear in this package's `dependencies`).
//
// react / react-dom are left external (peerDependencies).
//
// Declarations are intentionally NOT emitted here (`dts: false`). They come from
// `tsc --emitDeclarationOnly` via tsconfig.build.json, because plain tsup/esbuild
// declaration bundling re-exports `@tamagui/*` types into the public `.d.ts` and
// breaks the AC15 scratch consumer with TS2307 (docs/context §F1 / §C1).
//
// Hard constraint (docs/context §B2, §G7): never resolve the `react-native`
// export condition and never resolve `.native.js` as an extension — every
// react-native import inside Tamagui lives exclusively in `*.native.*` files
// reached only through that condition/extension. Leaving `conditions` and
// `platform` at their web defaults keeps dist clean.
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
