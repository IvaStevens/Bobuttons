#!/usr/bin/env node
// AC11 / AC12(b) / F6: no runtime `dependencies` at all (so @tamagui/core's
// transitive, non-optional react-native-web peer never reaches a consumer);
// no react-bootstrap / bootstrap / gluestack / umbrella `tamagui` dependency;
// every @tamagui/* pinned at exactly one version in the lockfile; no
// electron/ipc/sqlite/network package (components are presentational only).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

let failed = false;
function fail(msg) {
  console.error(`[check-dependencies] FAIL: ${msg}`);
  failed = true;
}

if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  fail(
    `package.json "dependencies" must be absent or empty, found: ${Object.keys(pkg.dependencies).join(", ")} (docs/context §F6 — @tamagui/core's transitive react-native-web peer is non-optional).`
  );
}

const forbidden = ["react-bootstrap", "bootstrap", "gluestack", "tamagui"];
const forbiddenPattern = /^(electron|sqlite3?|better-sqlite3)$/;
// AppGenerator currently ships gluestack-ui as a scoped family
// (@gluestack-ui/*, @gluestack-style/*) — the exact-match list above would
// never catch those (review finding, low). Substring-match "gluestack"
// specifically, case-insensitively, separately from the exact-match list
// (an exact-match umbrella check is still correct for "tamagui" itself —
// substring-matching THAT would false-positive on every legitimate
// "@tamagui/*" scoped package).
const GLUESTACK_SUBSTRING = /gluestack/i;
const allDeclared = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
  ...(pkg.peerDependencies || {}),
};
for (const name of Object.keys(allDeclared)) {
  if (forbidden.includes(name)) {
    fail(`forbidden dependency present: ${name} (AC11).`);
  }
  if (forbiddenPattern.test(name)) {
    fail(`forbidden dependency present: ${name} (presentational-only inventory rule).`);
  }
  if (GLUESTACK_SUBSTRING.test(name)) {
    fail(`forbidden gluestack-family dependency present: ${name} (AC11).`);
  }
}

const lockfilePath = path.join(root, "package-lock.json");
if (existsSync(lockfilePath)) {
  const lock = JSON.parse(readFileSync(lockfilePath, "utf8"));
  const packages = lock.packages || {};
  const tamaguiVersions = new Map();
  for (const [key, meta] of Object.entries(packages)) {
    const m = key.match(/node_modules\/(@tamagui\/[^/]+)$/);
    if (m && meta.version) {
      const name = m[1];
      const seen = tamaguiVersions.get(name) || new Set();
      seen.add(meta.version);
      tamaguiVersions.set(name, seen);
    }
    // Only the PRODUCTION tree matters here (AC12(b) is about the scratch
    // consumer's installed tree, which never sees this project's own
    // devDependencies at all). A dev-only transitive package — e.g.
    // react-native-web pulled in by @tamagui/core's devDependency chain
    // (docs/context §F6) — is expected and is not what AC12 is checking.
    if (
      /node_modules\/(react-native)(-|$)/.test(key) &&
      !key.includes("@tamagui/") &&
      meta.dev !== true
    ) {
      fail(`unscoped react-native* package present in the production tree: ${key} (AC12).`);
    }
  }
  for (const [name, versions] of tamaguiVersions) {
    if (versions.size > 1) {
      fail(`mixed @tamagui/* versions for ${name}: ${[...versions].join(", ")} (AC11).`);
    }
  }
  // Review finding (low): the per-package check above only catches the same
  // package name appearing at two versions, not the family as a whole (e.g.
  // @tamagui/core@3.0.18 alongside @tamagui/helpers@3.1.0 would pass). AC11
  // says "mixed @tamagui/* versions are not permitted" for the scope, not
  // per package — assert a single version across the entire @tamagui/* set.
  const familyVersions = new Set();
  for (const versions of tamaguiVersions.values()) {
    for (const v of versions) familyVersions.add(v);
  }
  if (familyVersions.size > 1) {
    fail(`mixed @tamagui/* versions across the family: ${[...familyVersions].join(", ")} (AC11 — exactly one version is permitted for the whole scope).`);
  }
} else {
  console.log("[check-dependencies] SKIP: package-lock.json not found (run npm install first).");
}

if (failed) process.exit(1);
console.log("[check-dependencies] PASS");
