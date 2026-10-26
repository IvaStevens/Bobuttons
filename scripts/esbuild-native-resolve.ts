// esbuild (tsup's bundler) has no built-in equivalent of Metro's or
// TypeScript's `.native.ts(x)`-sibling resolution: `resolveExtensions` only
// substitutes for EXTENSIONLESS specifiers, and every relative import in
// this repo uses an explicit ".js" specifier (required by the Node16/ESM
// resolution this package also typechecks under). Left unaddressed, the
// native tsup build silently bundles the WEB half of every seam — measured:
// without this plugin, dist/index.native.js contained the web
// BobuttonsProvider's `<style dangerouslySetInnerHTML>`, the web
// `useAccentGradient`'s `linear-gradient(...)` string, `useCapOffset`'s
// `document.createElement`, and so on, i.e. none of the seams actually took
// effect at the bundler level even though both the entry-rooted native
// typecheck (tsc's `moduleSuffixes`, a DIFFERENT and unrelated mechanism)
// and `tsc`'s own type resolution were green. A green typecheck is NOT
// evidence the bundler resolved the same file — this plugin, plus
// scripts/check-native-bundle.mjs's token scan, is what proves it did.
//
// For every relative import ending in .js/.jsx/.mjs, checks whether a
// `*.native.ts`/`*.native.tsx`/`*.native.js` sibling exists next to the
// resolved file and, if so, redirects esbuild's resolution there; otherwise
// falls through to esbuild's normal resolution (which maps the import's
// ".js" back to the sibling ".ts"/".tsx" file, same as it does for the web
// build).
import { existsSync } from "node:fs";
import path from "node:path";
import type { Plugin, OnResolveArgs, OnResolveResult } from "esbuild";

const RELATIVE_JS_IMPORT = /^\.\.?\//;
const JS_EXTENSION = /\.(m?js|jsx)$/;
const NATIVE_CANDIDATE_EXTENSIONS = [".native.tsx", ".native.ts", ".native.js"];

export const nativeResolvePlugin: Plugin = {
  name: "bobuttons-native-resolve",
  setup(build) {
    build.onResolve({ filter: RELATIVE_JS_IMPORT }, (args: OnResolveArgs): OnResolveResult | undefined => {
      if (!JS_EXTENSION.test(args.path)) return undefined;
      const resolvedBase = path.resolve(args.resolveDir, args.path);
      const withoutExtension = resolvedBase.replace(JS_EXTENSION, "");
      for (const ext of NATIVE_CANDIDATE_EXTENSIONS) {
        const candidate = withoutExtension + ext;
        if (existsSync(candidate)) {
          return { path: candidate };
        }
      }
      return undefined;
    });
  },
};

// @tamagui/web's `useMainThreadPressEvents` does
// `require("react-native").usePressability`, and that fails twice on device:
//   1. A bare `require("react-native")` is not a static import, so esbuild
//      emits its `__require` shim, which defers to the runtime `require`;
//      Metro cannot resolve a name it never saw at build time and throws
//      `Unknown named module: "react-native"`.
//   2. Even as a static import, react-native's public index does not export
//      `usePressability` (RN 0.83), so the call throws "usePressability is
//      not a function" the first time any Pressable-backed component renders.
// Rewriting the one expression to a static default import of the internal
// module makes it a build-time dependency Metro resolves, and gives a real
// function. RN's package `exports` map allows this deep path
// ("./*" -> "./*.js"). It is an internal module of react-native, so it is
// listed as external and called out in the README.
export const REACT_NATIVE_USE_PRESSABILITY = "react-native/Libraries/Pressability/usePressability";
const USE_PRESSABILITY_ACCESS = /\brequire\(\s*(["'])react-native\1\s*\)\.usePressability\b/g;

export const staticUsePressabilityPlugin: Plugin = {
  name: "bobuttons-static-use-pressability",
  setup(build) {
    build.onLoad({ filter: /node_modules[\\/]@tamagui[\\/].*\.m?js$/ }, async (args) => {
      const { readFile } = await import("node:fs/promises");
      const source = await readFile(args.path, "utf8");
      if (!USE_PRESSABILITY_ACCESS.test(source)) return undefined;
      USE_PRESSABILITY_ACCESS.lastIndex = 0;
      return {
        contents: `import __bobuttonsUsePressability from "${REACT_NATIVE_USE_PRESSABILITY}";\n${source.replace(
          USE_PRESSABILITY_ACCESS,
          "__bobuttonsUsePressability",
        )}`,
        loader: "js",
      };
    });
  },
};
