#!/usr/bin/env node
// Scans every WEB file emitted into dist for an import/require of exactly
// `react-native` or `react-native-web` (optionally with a subpath). Anchored on
// the specifier, since `@tamagui/react-native-media-driver` must not match.
//
// AUTHORISED EDIT under B2-AC10(i): `dist/index.native.js` is excluded BY
// EXACT FILENAME — it is the one shipped bundle that LEGITIMATELY imports
// `react-native` (B2-AC7). Six enumerated changes from the pre-B2 version:
//   1. the exclusion above (surgical: before this ticket there were zero
//      .js files in dist, so widening the glob to include .js and then
//      excluding exactly "index.native.js" cannot accidentally exempt a web
//      bundle);
//   2. an assertion that the scanned set still contains every web bundle
//      BY NAME (not just a count, which would be brittle across slices);
//   3. an assertion that dist/index.native.js exists and was the only file
//      excluded;
//   4. --self-test: plants a bare `react-native` specifier in a dist-shaped
//      temp dir and fails if the scanner passes, plus a clean positive
//      control — proving this gate still bites after being re-scoped (the
//      dangerous failure mode for a re-scope is turning it into a no-op);
//   5. the zero-files SKIP branch is UNCHANGED (still prints SKIP and exits
//      0) — re-scoping must not turn it into a silent no-op either;
//   6. no pre-existing bare `AC<n>` reference existed in this file, so no
//      B1- rewrite was needed.
import fg from "fast-glob";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");
const selfTest = process.argv.includes("--self-test");

// Also matches side-effect (`import "x"`) and dynamic imports.
const SPECIFIER = /(?:from\s+|require\(\s*|import\(\s*|\bimport\s+)["']((?:react-native|react-native-web)(?:\/[^"']*)?)["']/g;

function scan(dir) {
  const allFiles = fg.sync(["**/*.{js,mjs,cjs,d.ts,d.cts,d.mts}"], { cwd: dir, absolute: true });
  const excluded = allFiles.filter((f) => path.basename(f) === "index.native.js");
  const files = allFiles.filter((f) => path.basename(f) !== "index.native.js");
  return { allFiles, excluded, files };
}

function runScan(dir, { requireWebNames = false } = {}) {
  const { allFiles, excluded, files } = scan(dir);
  if (allFiles.length === 0) {
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

  if (requireWebNames) {
    const relNames = new Set(files.map((f) => path.basename(f)));
    for (const expected of ["index.mjs", "index.cjs", "index.d.ts", "index.d.mts", "index.d.cts"]) {
      if (!relNames.has(expected)) {
        console.error(`[check-no-react-native] FAIL: expected scanned set to include ${expected}, it did not.`);
        failed = true;
      }
    }
    if (excluded.length !== 1 || path.basename(excluded[0]) !== "index.native.js") {
      console.error(`[check-no-react-native] FAIL: expected exactly dist/index.native.js to be excluded, excluded=${excluded.map((f) => path.relative(root, f)).join(",")}`);
      failed = true;
    } else {
      console.log(`[check-no-react-native] dist/index.native.js (the one legitimately react-native-importing bundle) is excluded by exact filename.`);
    }
  }

  return { failed, scannedCount: files.length };
}

if (selfTest) {
  let selfTestFailed = false;

  // Positive control: a clean dist-shaped temp dir must pass.
  const cleanDir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-clean-"));
  try {
    writeFileSync(path.join(cleanDir, "index.mjs"), 'import "react";\nexport {};\n');
    const { failed } = runScan(cleanDir);
    if (failed) {
      console.error("[check-no-react-native] self-test FAIL: clean positive control unexpectedly failed.");
      selfTestFailed = true;
    } else {
      console.log("[check-no-react-native] self-test: clean positive control passes.");
    }
  } finally {
    rmSync(cleanDir, { recursive: true, force: true });
  }

  // Negative control: a planted violation in a non-excluded file must fail.
  const dirtyDir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-dirty-"));
  try {
    writeFileSync(path.join(dirtyDir, "index.mjs"), 'import "react-native";\nexport {};\n');
    const { failed } = runScan(dirtyDir);
    if (!failed) {
      console.error("[check-no-react-native] self-test FAIL: planted react-native import in index.mjs was not caught.");
      selfTestFailed = true;
    } else {
      console.log("[check-no-react-native] self-test: planted violation in index.mjs is caught.");
    }
  } finally {
    rmSync(dirtyDir, { recursive: true, force: true });
  }

  // The exclusion itself must stay surgical: a violation INSIDE
  // index.native.js must NOT be caught (that file is expected to import
  // react-native), proving the exclusion isn't accidentally exempting
  // something it shouldn't.
  const nativeOnlyDir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-native-"));
  try {
    mkdirSync(nativeOnlyDir, { recursive: true });
    writeFileSync(path.join(nativeOnlyDir, "index.native.js"), 'import "react-native";\nexport {};\n');
    const { failed } = runScan(nativeOnlyDir);
    if (failed) {
      console.error("[check-no-react-native] self-test FAIL: dist/index.native.js's own react-native import was incorrectly flagged.");
      selfTestFailed = true;
    } else {
      console.log("[check-no-react-native] self-test: dist/index.native.js's own react-native import is correctly excluded.");
    }
  } finally {
    rmSync(nativeOnlyDir, { recursive: true, force: true });
  }

  if (selfTestFailed) process.exit(1);
  console.log("[check-no-react-native] self-test PASS");
  process.exit(0);
}

const { failed, scannedCount } = runScan(distDir, { requireWebNames: true });
if (failed) process.exit(1);
console.log(`[check-no-react-native] PASS (scanned ${scannedCount} web files; dist/index.native.js excluded by name)`);
