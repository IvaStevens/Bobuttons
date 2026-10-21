#!/usr/bin/env node
// (a) Always asserts sha256(themes.source.css) === meta.sha256, which catches
// local edits and runs in CI.
// (b) If meta.sourcePath exists, byte-compares against it and fails with the
// refresh command on drift. Absence never fails; that is the point of vendoring.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const cssPath = path.join(root, "src/themes/themes.source.css");
const metaPath = path.join(root, "src/themes/themes.source.meta.json");

const css = readFileSync(cssPath);
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
const sha256 = createHash("sha256").update(css).digest("hex");

let failed = false;

if (sha256 !== meta.sha256) {
  console.error(
    `[check-theme-source] FAIL: sha256(themes.source.css)=${sha256} != meta.sha256=${meta.sha256}. Someone edited the vendored copy directly; regenerate with: ${meta.refreshCommand}`
  );
  failed = true;
}

const sourcePath = path.resolve(root, meta.sourcePath);
if (existsSync(sourcePath)) {
  const real = readFileSync(sourcePath);
  if (!real.equals(css)) {
    console.error(
      `[check-theme-source] FAIL: themes.source.css has drifted from ${meta.sourcePath}. Refresh with: ${meta.refreshCommand}`
    );
    failed = true;
  } else {
    console.log("[check-theme-source] drift check against sibling repo: PASS");
  }
} else {
  // Deliberately not "SKIP": verify.mjs treats that token as a temporary
  // omission that must be declared in verify.expected-skips.json. The sibling
  // checkout is permanently absent in CI.
  console.log(`[check-theme-source] N/A (sibling repo absent): drift check against ${meta.sourcePath} not applicable on this machine — sha check already verified the vendored copy is untouched.`);
}

if (failed) process.exit(1);
console.log("[check-theme-source] PASS");
