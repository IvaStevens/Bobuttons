#!/usr/bin/env node
// The single verify gate: 25 ordered steps, cheap static checks first, one
// build and one pack reused by later steps. Aborts on first failure.
// Runs with TZ=UTC and LANG=C.UTF-8.
//
// BOBUTTONS-4 added two steps (23 -> 25): "check-icon-packs" (static mode)
// right after "check-themes", at the same cheap-first position as the other
// static generator-drift gates, so a generator/fidelity/naming/isolation
// failure surfaces before any build/typecheck/storybook cost is spent; and
// "check-icon-packs --artifacts" right after the tarball integrity step,
// because that mode needs a real packed tarball to build a real consumer
// bundle from.
//
// A step with nothing to check yet prints "SKIP" and exits 0. Every SKIP must
// be declared in scripts/verify.expected-skips.json or the gate fails; that
// file must shrink to [] by the end of Slice 2.
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
runStep("check-themes", () => node("scripts/check-themes.mjs"));
// 4 — BOBUTTONS-4, static only (no build needed): generator no-diff,
// fidelity against installed lucide, name/Feather/peer declaration checks,
// two-way source isolation. Cheap-first, right after the other static
// generator-drift gate (check-themes).
runStep("check-icon-packs", () => node("scripts/check-icon-packs.mjs"));
// 5 — B2-AC29, static only (no Android/metro/build needed).
runStep("check-native-audit", () => node("scripts/check-native-audit.mjs"));
// 6
runStep("lint", () => {
  const out = sh("npx", ["eslint", "."]);
  console.log(out.trim());
  return out;
});
// 7
runStep("typecheck-bundler", () => {
  const out = sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.bundler.json"]);
  console.log(out.trim());
  return out;
});
// 8
runStep("typecheck-node16", () => {
  const out = sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.node16.json"]);
  console.log(out.trim());
  return out;
});
// 9/10 — entry-rooted, DOM-free: the mechanical backstop for B2-AC12/B2-AC29.
runStep("typecheck-native-bundler", () => {
  const out = sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.native.bundler.json"]);
  console.log(out.trim());
  return out;
});
runStep("typecheck-native-node16", () => {
  const out = sh("npx", ["tsc", "--noEmit", "-p", "tsconfig.typecheck.native.node16.json"]);
  console.log(out.trim());
  return out;
});
// 11
runStep("build", () => {
  const out = sh("node", [path.join(root, "scripts/build.mjs")]);
  console.log(out.trim());
  return out;
});
// 12
runStep("check-no-react-native", () => node("scripts/check-no-react-native.mjs"));
// 13 — proves the re-scoped scanner from step 12 still bites (B2-AC10).
runStep("check-no-react-native-self-test", () => node("scripts/check-no-react-native.mjs", ["--self-test"]));
// 14
runStep("check-dts-encapsulation", () => node("scripts/check-dts-encapsulation.mjs"));
// 15
runStep("check-dist-size", () => node("scripts/check-dist-size.mjs"));
// 16
runStep("check-inventory-coverage", () => node("scripts/check-inventory-coverage.mjs"));
// 17 — the static honesty gate: tsconfig coverage + no-iOS-paths (B2-AC24).
runStep("check-native-coverage", () => node("scripts/check-native-coverage.mjs", ["--self-test"]));
// 18
runStep("pack", () => {
  mkdirSync(path.join(root, ".verify-out"), { recursive: true });
  const out = sh("npm", ["pack", "--ignore-scripts", "--pack-destination", ".verify-out", "--json"]);
  writeFileSync(path.join(root, ".verify-out/pack.json"), out, "utf8");
  return out;
});
// 19 — the environment-independent native gate: Metro build + token scan +
// native consumer typecheck pair over the packed tarball (B2-AC2/B2-AC3's
// on-device render check is explicitly NOT here — see README).
runStep("check-native-bundle", () => node("scripts/check-native-bundle.mjs", ["--self-test"]));
// 20
runStep("check-package-integrity-tarball", () => node("scripts/check-package-integrity.mjs", ["--tarball"]));
// 21 — BOBUTTONS-4's --artifacts mode: needs the real tarball from step 18,
// so it cannot run any earlier than this.
runStep("check-icon-packs-artifacts", () => node("scripts/check-icon-packs.mjs", ["--artifacts"]));
// 22
runStep("check-scratch-install", () => node("scripts/check-scratch-install.mjs"));
// 23
runStep("build-storybook", () => {
  const out = sh("npx", ["storybook", "build"]);
  console.log(out.trim());
  return out;
});
// 24 — every story renders; axe reports no violations on "default", and
// colour-contrast is additionally gated on jade (see vitest.config.ts).
runStep("storybook-a11y", () => {
  try {
    const out = sh("npx", ["vitest", "run"]);
    console.log(out.trim());
    return out;
  } catch (err) {
    // Print vitest's failure output before aborting.
    console.error(String(err.stdout || ""));
    console.error(String(err.stderr || ""));
    throw err;
  }
});
// 25
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
