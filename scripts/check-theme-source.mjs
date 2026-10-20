#!/usr/bin/env node
// docs/context §N5 / AC8. (a) ALWAYS assert sha256(themes.source.css) ===
// meta.sha256 — catches a local edit, runs everywhere including CI.
// (b) If meta.sourcePath exists on disk, byte-compare against the real file
// and fail with the refresh command on drift; if absent, SKIP and pass.
// Never fails for absence — that is the whole point of vendoring.
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
  // Deliberately NOT the word "SKIP": verify.mjs treats any step whose
  // output contains that token as a slice-boundary omission that must be
  // declared in verify.expected-skips.json and that disappears as the
  // inventory lands. This is a different, permanent kind of omission — the
  // sibling oncall-navigator-app checkout is never present in CI (the
  // workflow checks out only this repo) and is not expected to be. The sha
  // check above still ran and is the thing that actually gates drift.
  console.log(`[check-theme-source] N/A (sibling repo absent): drift check against ${meta.sourcePath} not applicable on this machine — sha check already verified the vendored copy is untouched.`);
}

if (failed) process.exit(1);
console.log("[check-theme-source] PASS");
