#!/usr/bin/env node
// No runtime `dependencies` (so @tamagui/core's react-native-web peer never
// reaches a consumer); no react-bootstrap/bootstrap/gluestack/umbrella
// `tamagui`; a single @tamagui/* version in the lockfile; no
// electron/sqlite packages (components are presentational only).
//
// REFUTED, not re-scoped (B2-AC10): `react-native` becoming a peer AND a
// pinned devDependency (B2-AC6/B2-AC9) does not need this script's
// production-tree assertion loosened. Verified: npm marks
// `node_modules/react-native` `dev: true` here (it is declared only in
// devDependencies, same as `react`/`react-dom` already were), so the
// `meta.dev !== true` predicate below still finds zero hits. An earlier
// draft of this ticket's plan assumed this script would need re-scoping;
// it does not, and re-scoping an unmodified gate would itself have been an
// unauthorised loosening.
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
    `package.json "dependencies" must be absent or empty, found: ${Object.keys(pkg.dependencies).join(", ")}.`
  );
}

const forbidden = ["react-bootstrap", "bootstrap", "gluestack", "tamagui"];
const forbiddenPattern = /^(electron|sqlite3?|better-sqlite3)$/;
// gluestack ships as scoped packages (@gluestack-ui/*), so it needs a
// substring match. "tamagui" can't: that would flag every @tamagui/* package.
const GLUESTACK_SUBSTRING = /gluestack/i;
const allDeclared = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
  ...(pkg.peerDependencies || {}),
};
for (const name of Object.keys(allDeclared)) {
  if (forbidden.includes(name)) {
    fail(`forbidden dependency present: ${name} (B1-AC11).`);
  }
  if (forbiddenPattern.test(name)) {
    fail(`forbidden dependency present: ${name} (presentational-only inventory rule).`);
  }
  if (GLUESTACK_SUBSTRING.test(name)) {
    fail(`forbidden gluestack-family dependency present: ${name} (B1-AC11).`);
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
    // Production tree only: dev-only transitive packages (e.g. react-native-web
    // via @tamagui/core) never reach consumers.
    if (
      /node_modules\/(react-native)(-|$)/.test(key) &&
      !key.includes("@tamagui/") &&
      meta.dev !== true
    ) {
      fail(`unscoped react-native* package present in the production tree: ${key} (B1-AC12).`);
    }
  }
  for (const [name, versions] of tamaguiVersions) {
    if (versions.size > 1) {
      fail(`mixed @tamagui/* versions for ${name}: ${[...versions].join(", ")} (B1-AC11).`);
    }
  }
  // The check above is per package; also require one version across the family.
  const familyVersions = new Set();
  for (const versions of tamaguiVersions.values()) {
    for (const v of versions) familyVersions.add(v);
  }
  if (familyVersions.size > 1) {
    fail(`mixed @tamagui/* versions across the family: ${[...familyVersions].join(", ")} (B1-AC11 — exactly one version is permitted for the whole scope).`);
  }
} else {
  console.log("[check-dependencies] SKIP: package-lock.json not found (run npm install first).");
}

if (failed) process.exit(1);
console.log("[check-dependencies] PASS");
