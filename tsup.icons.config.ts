import { defineConfig } from "tsup";

// Web pack build: four independent entries -> dist/icons/<pack>.{mjs,cjs}.
// Each pack is its OWN module graph (no shared chunk with the other packs or
// with index.mjs/index.cjs) — `splitting: false` is load-bearing for that,
// same reasoning as tsup.config.ts. `clean: false` is load-bearing too: this
// config runs AFTER both existing builds in scripts/build.mjs and must not
// delete dist/index.mjs/.cjs. `external` is copied verbatim from
// tsup.config.ts so the pack bundles share the same peer-externalisation
// contract as the main entry.
export default defineConfig({
  entry: {
    "icons/animal": "src/icons/animal.ts",
    "icons/basic": "src/icons/basic.ts",
    "icons/food": "src/icons/food.ts",
    "icons/shapes": "src/icons/shapes.ts",
  },
  format: ["esm", "cjs"],
  platform: "browser",
  target: "es2022",
  outDir: "dist",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".mjs" };
  },
  dts: false,
  sourcemap: false,
  clean: false,
  splitting: false,
  external: ["react", "react-dom", "react/jsx-runtime"],
  skipNodeModulesBundle: false,
});
