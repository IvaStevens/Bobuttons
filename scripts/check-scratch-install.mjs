#!/usr/bin/env node
// Installs the tarball `npm run pack` produced into a throwaway consumer with
// `npm install --offline` (react/react-dom are cache-warmed first, so an unexpected
// network fetch fails loudly), typechecks ESM and CJS entries under bundler
// and node16 resolution, runs both through react-dom/server, and scans the
// installed tree for unscoped react-native* packages.
//
// The fixture is copied from scripts/scratch-consumer/ into the OS temp dir,
// outside the repo, so resolution can't walk up into Bobuttons' node_modules;
// its package.json is generated, so the tracked template stays untouched.
//
// AUTHORISED EDIT under B2-AC10(ii)/B2-AC23, four enumerated changes:
//   1. the unscoped-react-native* scan now walks the PARSED `npm ls --json
//      --all` tree instead of matching raw text, and fails only on a node
//      that is actually installed (has a "version") or reports a
//      missing/problem — VERIFIED NECESSARY: once `react-native` is a
//      declared peer (optional or not), npm prints an empty placeholder
//      `"react-native": {}` for it even when nothing is installed, which the
//      old raw-text regex matched, so this web scenario would otherwise
//      fail on a perfectly clean tree;
//   2. ADDS an assertion that `react-dom` IS installed — decision D6 demoted
//      it to an optional peer so a native consumer's tree stays free of it
//      (B2-AC8), which means this WEB scenario must now install it
//      explicitly (`basePkg.dependencies` below) or npm would not auto-
//      install it either, and this assertion is what proves that didn't
//      silently regress;
//   3. this header comment;
//   4. nothing else changes — the offline install, both typechecks, the
//      react-dom/server execution and the tree-shake probe are untouched.
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

// Fixture directory outside the repo.
const fixtureDir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-scratch-"));

class ScratchInstallAbort extends Error {}

try {
  for (const file of ["index.mts", "index.cts", "tree-shake.mts", "tsconfig.emit.json", "tsconfig.typecheck.bundler.json", "tsconfig.typecheck.node16.json"]) {
    cpSync(path.join(templateDir, file), path.join(fixtureDir, file));
  }

  // Template package.json plus the tarball dependency.
  const basePkg = JSON.parse(readFileSync(path.join(templateDir, "package.json"), "utf8"));
  basePkg.dependencies = { ...basePkg.dependencies, bobuttons: `file:${tarballPath}` };
  writeFileSync(path.join(fixtureDir, "package.json"), JSON.stringify(basePkg, null, 2) + "\n");

  // Warm npm's cache with the fixture's own pinned dependencies, online, in a throwaway
  // directory. Without this the offline install below only works where the cache already
  // holds React's metadata, i.e. not on a fresh CI runner. The real install stays offline,
  // so anything beyond these pinned versions still fails loudly.
  const warmDir = mkdtempSync(path.join(os.tmpdir(), "bobuttons-scratch-warm-"));
  try {
    cpSync(path.join(templateDir, "package.json"), path.join(warmDir, "package.json"));
    execFileSync("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts"], { cwd: warmDir, stdio: "pipe" });
  } catch (err) {
    fail(`cache warm-up failed (it needs the network once): ${String(err.stderr || err.message).slice(0, 2000)}`);
    throw new ScratchInstallAbort();
  } finally {
    rmSync(warmDir, { recursive: true, force: true });
  }

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

  // Tree-shake probe: bundle a single-`Button`-import entry with esbuild (here
  // transitively via vite) and log its size. Logged, not gated on a budget.
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

  // No unscoped react-native* package ACTUALLY INSTALLED in the tree, and
  // react-dom IS installed (B2-AC8/B2-AC23/B2-AC10(ii)). Walks the PARSED
  // tree rather than matching raw text: npm ls prints an empty placeholder
  // `"react-native": {}` for a declared-but-absent peer (optional or not),
  // which a text regex would incorrectly flag on a perfectly clean tree
  // now that `react-native` is a peer at all — verified by probe.
  let lsJson;
  try {
    const lsOut = execFileSync("npm", ["ls", "--json", "--all"], { cwd: fixtureDir, stdio: "pipe" }).toString();
    lsJson = JSON.parse(lsOut);
  } catch (err) {
    // npm ls exits non-zero on peer-dep warnings; stdout still has the JSON.
    try {
      lsJson = JSON.parse(String(err.stdout || "{}"));
    } catch {
      fail(`npm ls --json --all produced unparseable output: ${String(err.stdout || err.stderr || err.message).slice(0, 500)}`);
    }
  }

  if (lsJson) {
    const unscopedReactNativeHits = [];
    let reactDomInstalled = false;

    function walk(name, node, scopePath) {
      if (!node || typeof node !== "object") return;
      const isUnscopedReactNative = /^react-native(-|$)/.test(name);
      const isActuallyInstalled = typeof node.version === "string";
      const hasProblem = node.missing === true || (Array.isArray(node.problems) && node.problems.length > 0);
      if (isUnscopedReactNative && (isActuallyInstalled || hasProblem)) {
        unscopedReactNativeHits.push(`${scopePath}${name}@${node.version ?? "(missing/problem)"}`);
      }
      if (name === "react-dom" && isActuallyInstalled) reactDomInstalled = true;
      for (const [depName, depNode] of Object.entries(node.dependencies || {})) {
        walk(depName, depNode, `${scopePath}${name} > `);
      }
    }
    for (const [name, node] of Object.entries(lsJson.dependencies || {})) {
      walk(name, node, "");
    }

    if (unscopedReactNativeHits.length > 0) {
      fail(`an unscoped react-native* package is actually installed in the scratch consumer's tree: ${unscopedReactNativeHits.join(", ")}`);
    } else {
      console.log("[check-scratch-install] no unscoped react-native* package is actually installed in the tree: PASS");
    }

    if (!reactDomInstalled) {
      fail("react-dom is NOT installed in the web scratch consumer's tree (B2-AC23: react-dom is now an optional peer, so a web consumer must install it explicitly — this scenario's package.json should already declare it as a dependency).");
    } else {
      console.log("[check-scratch-install] react-dom is installed in the web scratch consumer's tree: PASS");
    }
  }
} catch (err) {
  if (!(err instanceof ScratchInstallAbort)) throw err;
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("[check-scratch-install] PASS");
