#!/usr/bin/env node
// Scans every WEB file emitted into dist for an import/require of exactly
// `react-native`, `react-native-web` or `react-native-svg` (optionally with a
// subpath). Anchored on the specifier, since `@tamagui/react-native-media-driver`
// must not match.
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
//
// BOBUTTONS-4 THREE-PART RE-SCOPE (all three needed together — fixing only
// one of these would either make the gate a no-op or false-fail the four
// legitimate pack native bundles):
//   (i)   the SPECIFIER alternation below gained `react-native-svg` — the
//         previous alternation only matched a string equal to exactly
//         "react-native"/"react-native-web" (optionally with a "/subpath"),
//         so "react-native-svg" (a different package name, not a subpath of
//         "react-native") passed through uncaught;
//   (ii)  the exclusion predicate changed from "basename === index.native.js"
//         to "dist-relative path ends with .native.js" — the four pack
//         native bundles (icons/<pack>.native.js) legitimately import
//         react-native-svg, same as index.native.js legitimately imports
//         react-native, and scanning them as web files would false-FAIL the
//         moment (i) landed;
//   (iii) the excluded-set assertion changed from "exactly one file" to "the
//         exact five-file native set" (index.native.js + the four pack
//         native bundles).
import fg from "fast-glob";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");
const selfTest = process.argv.includes("--self-test");

// Also matches side-effect (`import "x"`) and dynamic imports.
const SPECIFIER = /(?:from\s+|require\(\s*|import\(\s*|\bimport\s+)["']((?:react-native-svg|react-native-web|react-native)(?:\/[^"']*)?)["']/g;

const EXPECTED_NATIVE_BUNDLES = ["index.native.js", "icons/animal.native.js", "icons/basic.native.js", "icons/food.native.js", "icons/shapes.native.js"];
const EXPECTED_WEB_BUNDLES = [
  "index.mjs",
  "index.cjs",
  "index.d.ts",
  "index.d.mts",
  "index.d.cts",
  "icons/animal.mjs",
  "icons/animal.cjs",
  "icons/basic.mjs",
  "icons/basic.cjs",
  "icons/food.mjs",
  "icons/food.cjs",
  "icons/shapes.mjs",
  "icons/shapes.cjs",
];

function isNativeBundle(relPath) {
  return relPath.endsWith(".native.js");
}

function scan(dir) {
  const allRel = fg.sync(["**/*.{js,mjs,cjs,d.ts,d.cts,d.mts}"], { cwd: dir });
  const excludedRel = allRel.filter(isNativeBundle);
  const filesRel = allRel.filter((f) => !isNativeBundle(f));
  return {
    allFiles: allRel.map((f) => path.join(dir, f)),
    excluded: excludedRel.map((f) => path.join(dir, f)),
    excludedRel,
    files: filesRel.map((f) => path.join(dir, f)),
  };
}

function runScan(dir, { requireWebNames = false, requireNativeSet = false } = {}) {
  const { allFiles, excluded, excludedRel, files } = scan(dir);
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
    const relNames = new Set(files.map((f) => path.relative(dir, f)));
    for (const expected of EXPECTED_WEB_BUNDLES) {
      if (!relNames.has(expected)) {
        console.error(`[check-no-react-native] FAIL: expected scanned set to include ${expected}, it did not.`);
        failed = true;
      }
    }
  }

  if (requireNativeSet) {
    const excludedSet = new Set(excludedRel);
    const expectedSet = new Set(EXPECTED_NATIVE_BUNDLES);
    const missing = EXPECTED_NATIVE_BUNDLES.filter((f) => !excludedSet.has(f));
    const extra = excludedRel.filter((f) => !expectedSet.has(f));
    if (missing.length > 0 || extra.length > 0) {
      console.error(
        `[check-no-react-native] FAIL: expected exactly the native bundle set ${JSON.stringify(EXPECTED_NATIVE_BUNDLES)} to be excluded, excluded=${JSON.stringify(excludedRel)}`
      );
      failed = true;
    } else {
      console.log(`[check-no-react-native] all 5 native bundles (${excludedRel.join(", ")}) are excluded by the .native.js suffix.`);
    }
  }

  return { failed, scannedCount: files.length, excluded };
}

if (selfTest) {
  let selfTestFailed = false;

  function expect(label, condition) {
    if (condition) {
      console.log(`[check-no-react-native] self-test: ${label}.`);
    } else {
      console.error(`[check-no-react-native] self-test FAIL: ${label}.`);
      selfTestFailed = true;
    }
  }

  // Positive control: a clean dist-shaped temp dir must pass.
  {
    const dir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-clean-"));
    try {
      writeFileSync(path.join(dir, "index.mjs"), 'import "react";\nexport {};\n');
      const { failed } = runScan(dir);
      expect("clean positive control passes", !failed);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // Negative control: a planted bare react-native import in a non-excluded
  // file must fail.
  {
    const dir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-dirty-"));
    try {
      writeFileSync(path.join(dir, "index.mjs"), 'import "react-native";\nexport {};\n');
      const { failed } = runScan(dir);
      expect("planted react-native violation in index.mjs is caught", failed);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // The exclusion itself must stay surgical: a violation INSIDE
  // index.native.js must NOT be caught (that file is expected to import
  // react-native), proving the exclusion isn't accidentally exempting
  // something it shouldn't.
  {
    const dir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-native-"));
    try {
      writeFileSync(path.join(dir, "index.native.js"), 'import "react-native";\nexport {};\n');
      const { failed } = runScan(dir);
      expect("dist/index.native.js's own react-native import is correctly excluded", !failed);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // (i)+(ii): a planted react-native-svg specifier in a WEB pack bundle must
  // FAIL — this is the one the matcher alone (without the exclusion
  // predicate change) would previously have missed entirely.
  {
    const dir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-svg-web-"));
    try {
      mkdirSync(path.join(dir, "icons"), { recursive: true });
      writeFileSync(path.join(dir, "icons", "animal.mjs"), 'import "react-native-svg";\nexport {};\n');
      const { failed } = runScan(dir);
      expect("planted react-native-svg violation in a web pack bundle (icons/animal.mjs) is caught", failed);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  // (ii): the SAME react-native-svg import inside a NATIVE pack bundle
  // (icons/animal.native.js) must PASS — proving the exclusion predicate
  // change (basename === "index.native.js" -> suffix ".native.js") correctly
  // covers the four new pack native bundles, not just index.native.js.
  {
    const dir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-no-rn-svg-native-"));
    try {
      mkdirSync(path.join(dir, "icons"), { recursive: true });
      writeFileSync(path.join(dir, "icons", "animal.native.js"), 'import "react-native-svg";\nexport {};\n');
      const { failed } = runScan(dir);
      expect("the same react-native-svg import inside icons/animal.native.js is correctly excluded", !failed);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  if (selfTestFailed) process.exit(1);
  console.log("[check-no-react-native] self-test PASS");
  process.exit(0);
}

const { failed, scannedCount } = runScan(distDir, { requireWebNames: true, requireNativeSet: true });
if (failed) process.exit(1);
console.log(`[check-no-react-native] PASS (scanned ${scannedCount} web files; 5 native bundles excluded by suffix)`);
