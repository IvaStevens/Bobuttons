#!/usr/bin/env node
// Scans every file emitted into dist for an import/require of exactly
// `react-native` or `react-native-web` (optionally with a subpath). Anchored on
// the specifier, since `@tamagui/react-native-media-driver` must not match.
import fg from "fast-glob";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");

// Also matches side-effect (`import "x"`) and dynamic imports.
const SPECIFIER = /(?:from\s+|require\(\s*|import\(\s*|\bimport\s+)["']((?:react-native|react-native-web)(?:\/[^"']*)?)["']/g;

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
