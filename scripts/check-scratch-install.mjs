#!/usr/bin/env node
// AC15 + AC12(b) + AC21 (tree-shaking probe). Installs the SAME tarball
// `npm run pack` just produced into a throwaway fixture directory with
// `npm install --offline` (docs/context §G4: pre-seeded react/react-dom so
// an unexpected network fetch fails loudly instead of silently resolving a
// newer major), typechecks an ESM and a CJS entry under both
// moduleResolution bundler and node16 (docs/context §F7: explicit .mts/.cts
// extensions, not a bare .ts pair), compiles and EXECUTES both through
// react-dom/server renderToString, and scans the installed tree for any
// unscoped react-native* package.
//
// Review findings (medium), both fixed by moving the run OUTSIDE the repo:
//   1. The previous version MUTATED the tracked
//      scripts/scratch-consumer/package.json in place, writing a machine-
//      specific absolute `file:` path on every run and leaving the working
//      tree dirty.
//   2. The fixture lived inside the repo, so Node's and TypeScript's module
//      resolution could walk UP into Bobuttons' own node_modules (which
//      does contain @tamagui/*, @types/react, typescript, react-native-web
//      via @tamagui/core's devDependency chain) — weaker than AC15's
//      "installing only react, react-dom and the Bobuttons tarball".
//
// This version copies the fixture's static template files (index.mts,
// index.cts, tree-shake.mts, the three tsconfigs) into a fresh directory
// under the OS temp root (outside this repo entirely, so resolution cannot
// walk up into Bobuttons' node_modules), writes a generated package.json
// there (never touching the tracked template), and runs everything from
// there. The tracked scripts/scratch-consumer/ directory holds only the
// template source now.
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const templateDir = path.join(root, "scripts/scratch-consumer");
const tscBin = path.join(root, "node_modules/typescript/bin/tsc");

let failed = false;
function fail(msg) {
  console.error(`[check-scratch-install] FAIL: ${msg}`);
  failed = true;
}

const packMetaPath = path.join(root, ".verify-out/pack.json");
if (!existsSync(packMetaPath)) {
  console.log("[check-scratch-install] SKIP: .verify-out/pack.json not found — run `npm run pack` first.");
  process.exit(0);
}
const packMeta = JSON.parse(readFileSync(packMetaPath, "utf8"))[0];
const tarballPath = path.join(root, ".verify-out", packMeta.filename.replace("@", "").replace("/", "-"));
if (!existsSync(tarballPath)) {
  fail(`expected tarball at ${tarballPath}`);
  process.exit(1);
}

// Fresh, isolated fixture directory OUTSIDE the repo.
const fixtureDir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-scratch-"));

class ScratchInstallAbort extends Error {}

try {
  for (const file of ["index.mts", "index.cts", "tree-shake.mts", "tsconfig.emit.json", "tsconfig.typecheck.bundler.json", "tsconfig.typecheck.node16.json"]) {
    cpSync(path.join(templateDir, file), path.join(fixtureDir, file));
  }

  // Generated package.json (template base + the tarball dep by absolute
  // path) — written only into the throwaway fixture dir, never back into
  // the tracked template.
  const basePkg = JSON.parse(readFileSync(path.join(templateDir, "package.json"), "utf8"));
  basePkg.dependencies = { ...basePkg.dependencies, bobuttons: `file:${tarballPath}` };
  writeFileSync(path.join(fixtureDir, "package.json"), JSON.stringify(basePkg, null, 2) + "\n");

  try {
    execFileSync("npm", ["install", "--offline", "--no-audit", "--no-fund"], {
      cwd: fixtureDir,
      stdio: "pipe",
    });
  } catch (err) {
    fail(`"npm install --offline" failed — an unexpected network fetch was required: ${String(err.stderr || err.message).slice(0, 2000)}`);
    throw new ScratchInstallAbort();
  }

  // Typecheck under both resolutions.
  for (const [label, config] of [
    ["bundler", "tsconfig.typecheck.bundler.json"],
    ["node16", "tsconfig.typecheck.node16.json"],
  ]) {
    try {
      execFileSync(process.execPath, [tscBin, "--noEmit", "-p", config], { cwd: fixtureDir, stdio: "pipe" });
      console.log(`[check-scratch-install] typecheck (${label}): PASS`);
    } catch (err) {
      fail(`typecheck (${label}) failed:\n${String(err.stdout || err.message)}`);
    }
  }

  // Compile and execute the ESM and CJS entries.
  try {
    execFileSync(process.execPath, [tscBin, "-p", "tsconfig.emit.json"], { cwd: fixtureDir, stdio: "pipe" });
  } catch (err) {
    fail(`emit build failed:\n${String(err.stdout || err.message)}`);
  }

  for (const [label, file] of [
    ["ESM", "dist-run/index.mjs"],
    ["CJS", "dist-run/index.cjs"],
  ]) {
    const filePath = path.join(fixtureDir, file);
    if (!existsSync(filePath)) {
      fail(`expected compiled ${file} — emit build likely failed above.`);
      continue;
    }
    try {
      const out = execFileSync("node", [filePath], { cwd: fixtureDir, stdio: "pipe" }).toString();
      console.log(out.trim());
      if (!/OK/.test(out)) {
        fail(`${label} entry ran but did not report OK: ${out}`);
      }
    } catch (err) {
      fail(`${label} entry failed to execute: ${String(err.stdout || err.stderr || err.message)}`);
    }
  }

  // AC21 Slice 1 DoD, review finding (low): "a real bundler measurement is a
  // follow-up" was left unresolved in tree-shake.mts's own comment. esbuild
  // is already present transitively (via vite) in THIS project's
  // node_modules, so bundle the single-`Button`-import fixture entry with it
  // and log the resulting size — a real measurement, not a typecheck-only
  // proxy. Not gated against a budget (no prior baseline exists); logged so
  // a regression is visible in the verify log, same spirit as AC19.
  try {
    const esbuildBin = path.join(root, "node_modules/.bin/esbuild");
    const outFile = path.join(fixtureDir, "tree-shake.bundle.mjs");
    execFileSync(
      esbuildBin,
      [path.join(fixtureDir, "tree-shake.mts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${outFile}`],
      { cwd: fixtureDir, stdio: "pipe" }
    );
    const bundleBytes = readFileSync(outFile).length;
    console.log(`[check-scratch-install] tree-shake probe (single Button import, esbuild-bundled): ${bundleBytes}B`);
  } catch (err) {
    fail(`tree-shake bundle measurement failed: ${String(err.stdout || err.stderr || err.message)}`);
  }

  // AC12(b): no unscoped react-native* package in the installed tree. Now
  // meaningful (not just "the fixture's own tree is clean") because the
  // fixture has no Bobuttons ancestor directory for resolution to walk into.
  try {
    const lsOut = execFileSync("npm", ["ls", "--json", "--all"], {
      cwd: fixtureDir,
      stdio: "pipe",
    }).toString();
    if (/"react-native(-|")/i.test(lsOut.replace(/@tamagui\/[\w-]*react-native[\w-]*/gi, ""))) {
      fail("an unscoped react-native* package is present in the scratch consumer's installed tree.");
    } else {
      console.log("[check-scratch-install] no unscoped react-native* package in installed tree: PASS");
    }
  } catch (err) {
    // npm ls exits non-zero on peer-dep warnings even when the tree is fine;
    // stdout still contains the JSON we need.
    const out = String(err.stdout || "");
    if (/"react-native(-|")/i.test(out.replace(/@tamagui\/[\w-]*react-native[\w-]*/gi, ""))) {
      fail("an unscoped react-native* package is present in the scratch consumer's installed tree.");
    }
  }
} catch (err) {
  if (!(err instanceof ScratchInstallAbort)) throw err;
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("[check-scratch-install] PASS");
