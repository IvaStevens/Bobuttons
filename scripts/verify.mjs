#!/usr/bin/env node
// AC18: the single verify gate. docs/context §N9 — 17 ordered steps, cheap
// static checks first, ONE build, ONE pack, every later step reuses those
// two artefacts. Aborts on first failure. TZ=UTC + LANG=C.UTF-8 (AC17/AC18).
//
// AC18 vs AC21 reconciliation: a step may legitimately have nothing to check
// yet at the current slice (e.g. zero themes in Slice 0). Such a step prints
// a line containing "SKIP" and exits 0. Every SKIP must be pre-declared in
// scripts/verify.expected-skips.json — an UNDECLARED skip fails the gate.
// That file must shrink to [] by the end of Slice 2.
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

process.env.TZ = "UTC";
process.env.LANG = "C.UTF-8";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const expectedSkips = new Set(
  JSON.parse(readFileSync(path.join(root, "scripts/verify.expected-skips.json"), "utf8")).skips.map(
    (s) => s.step
  )
);

const results = [];
let aborted = false;

function runStep(name, fn) {
  if (aborted) return;
  console.log(`\n=== [verify] step: ${name} ===`);
  try {
    const output = fn();
    const skipped = typeof output === "string" && /SKIP/.test(output);
    if (skipped && !expectedSkips.has(name)) {
      console.error(`[verify] FAIL: step "${name}" reported SKIP but is not listed in verify.expected-skips.json.`);
      results.push({ name, status: "fail" });
      aborted = true;
      return;
    }
    results.push({ name, status: skipped ? "skip" : "pass" });
  } catch (err) {
    console.error(`[verify] step "${name}" failed.`);
    if (err && err.stdout) console.error(String(err.stdout));
    if (err && err.stderr) console.error(String(err.stderr));
    if (err && !err.stdout && !err.stderr) console.error(String(err.message || err));
    results.push({ name, status: "fail" });
    aborted = true;
  }
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: root, stdio: "pipe", encoding: "utf8", ...opts });
}

function node(scriptRelPath, args = []) {
  const out = sh("node", [path.join(root, scriptRelPath), ...args]);
  console.log(out.trim());
  return out;
}

// 1
runStep("check-dependencies", () => node("scripts/check-dependencies.mjs"));
// 2
runStep("check-package-integrity-static", () => node("scripts/check-package-integrity.mjs"));
// 3
runStep("check-theme-source", () => node("scripts/check-theme-source.mjs"));
// 4
runStep("check-themes", () => node("scripts/check-themes.mjs"));
// 5
runStep("lint", () => {
  const out = sh("npx", ["eslint", "."]);
  console.log(out.trim());
  return out;
});
// 6
runStep("typecheck-bundler", () => {
  const out = sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.bundler.json"]);
  console.log(out.trim());
  return out;
});
// 7
runStep("typecheck-node16", () => {
  const out = sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.node16.json"]);
  console.log(out.trim());
  return out;
});
// 8
runStep("build", () => {
  const out = sh("node", [path.join(root, "scripts/build.mjs")]);
  console.log(out.trim());
  return out;
});
// 9
runStep("check-no-react-native", () => node("scripts/check-no-react-native.mjs"));
// 10
runStep("check-dts-encapsulation", () => node("scripts/check-dts-encapsulation.mjs"));
// 11
runStep("check-dist-size", () => node("scripts/check-dist-size.mjs"));
// 12
runStep("check-inventory-coverage", () => node("scripts/check-inventory-coverage.mjs"));
// 13
runStep("pack", () => {
  mkdirSync(path.join(root, ".verify-out"), { recursive: true });
  const out = sh("npm", ["pack", "--ignore-scripts", "--pack-destination", ".verify-out", "--json"]);
  writeFileSync(path.join(root, ".verify-out/pack.json"), out, "utf8");
  return out;
});
// 14
runStep("check-package-integrity-tarball", () => node("scripts/check-package-integrity.mjs", ["--tarball"]));
// 15
runStep("check-scratch-install", () => node("scripts/check-scratch-install.mjs"));
// 16a
runStep("build-storybook", () => {
  const out = sh("npx", ["storybook", "build"]);
  console.log(out.trim());
  return out;
});
// 16b — AC16: every story renders without throwing; axe reports zero
// violations (excluding colour-contrast) on "default"; colour-contrast is
// additionally gated on jade-aa (docs/context §C3). See vitest.config.ts for
// the two browser projects and .storybook/preview.tsx for parameters.a11y.
runStep("storybook-a11y", () => {
  try {
    const out = sh("npx", ["vitest", "run"]);
    console.log(out.trim());
    return out;
  } catch (err) {
    // Surface vitest's own output (it writes failures to stdout/stderr, not
    // just a bare non-zero exit) before re-throwing to abort the gate.
    console.error(String(err.stdout || ""));
    console.error(String(err.stderr || ""));
    throw err;
  }
});
// 17
runStep("check-version-consistency", () => node("scripts/check-version-consistency.mjs"));

console.log("\n=== [verify] summary ===");
for (const r of results) {
  console.log(`${r.status.toUpperCase().padEnd(5)} ${r.name}`);
}

if (results.some((r) => r.status === "fail")) {
  console.error("\n[verify] FAILED");
  process.exit(1);
}
console.log("\n[verify] PASSED");
