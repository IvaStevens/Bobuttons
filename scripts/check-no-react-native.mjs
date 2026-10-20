#!/usr/bin/env node
// AC12(a): scan every file emitted into dist (.js/.mjs/.cjs/.d.ts/.d.cts — the
// Storybook build is explicitly out of scope) for an import/require of
// exactly `react-native` or `react-native-web`, optionally with a subpath.
// Specifier-anchored, never substring (docs/context §B3): a scoped package
// like `@tamagui/react-native-media-driver` contains the string but is not a
// react-native package and must not trip this check.
import fg from "fast-glob";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");

// Review finding (low): the previous pattern only matched `from "..."` and
// `require("...")`, missing a bare side-effect import (`import "react-native-web";`,
// no "from") and a dynamic `import("...")` — the sibling
// check-dts-encapsulation.mjs already covers `import(` and the two checks
// should not disagree on what counts as an import.
const SPECIFIER = /(?:from\s+|require\(\s*|import\(\s*|\bimport\s+)["']((?:react-native|react-native-web)(?:\/[^"']*)?)["']/g;

// Review finding (low): AC12(a)'s literal list is .js/.mjs/.cjs/.d.ts/.d.cts,
// but the build also emits dist/index.d.mts (a byte copy of index.d.ts,
// already walked by the sibling check-dts-encapsulation.mjs); include it so
// the two checks agree on what "built output" means.
const files = fg.sync(["**/*.{js,mjs,cjs,d.ts,d.cts,d.mts}"], { cwd: distDir, absolute: true });

if (files.length === 0) {
  console.log("[check-no-react-native] SKIP: dist/ not found or empty — run `npm run build` first.");
  process.exit(0);
}

let failed = false;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  let match;
  while ((match = SPECIFIER.exec(text))) {
    console.error(`[check-no-react-native] FAIL: ${path.relative(root, file)} imports "${match[1]}"`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`[check-no-react-native] PASS (scanned ${files.length} files)`);
