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
