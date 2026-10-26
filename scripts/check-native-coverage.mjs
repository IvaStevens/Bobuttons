#!/usr/bin/env node
// The static honesty gate for the typecheck matrix and the no-iOS
// guarantee. Scoped down from the original plan's fixture/harness-coverage
// checks: per the approved scope change, no scripts/native-harness/ and no
// fixtures module are committed to this repo (B2-AC2/B2-AC27's device-level
// parts are verified by hand in a scratch app outside the repo — see
// README). What remains here needs no device, emulator or SDK:
//
//   1. every file under src/ is reachable from at least one of the four
//      tsconfig.typecheck.*.json programs — so excluding *.native.ts(x)
//      from the two web configs (tsconfig.typecheck.{bundler,node16}.json)
//      can never silently stop compiling a file altogether;
//   2. no ios/, *.xcodeproj, *.xcworkspace, Podfile or *.podspec path
//      exists anywhere in the repo (B2-AC24) — mechanical, not a promise.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import fg from "fast-glob";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const selfTest = process.argv.includes("--self-test");

let failed = false;
function fail(msg) {
  console.error(`[check-native-coverage] FAIL: ${msg}`);
  failed = true;
}

const TSCONFIGS = [
  "tsconfig.typecheck.bundler.json",
  "tsconfig.typecheck.node16.json",
  "tsconfig.typecheck.native.bundler.json",
  "tsconfig.typecheck.native.node16.json",
];

function filesCompiledBy(cwd, tscBin, tsconfigAbsPath) {
  const out = execFileSync(
    process.execPath,
    [tscBin, "--noEmit", "-p", tsconfigAbsPath, "--listFilesOnly"],
    { cwd, encoding: "utf8" }
  );
  return new Set(
    out
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith(cwd))
      .map((l) => path.relative(cwd, l))
  );
}

// Shared by the real check and --self-test's negative control below: given a
// project root, a glob of files that must be covered, and a list of
// tsconfig paths (relative to that root), returns the files covered by NONE
// of them. Factored out so the self-test can prove this exact mechanism
// catches a real gap, not just that four filenames exist.
function uncoveredFiles(projectRoot, srcGlob, tsconfigRelPaths) {
  const tscBin = path.join(root, "node_modules/typescript/bin/tsc");
  const srcFiles = fg.sync([srcGlob], { cwd: projectRoot });
  const covered = new Set();
  for (const config of tsconfigRelPaths) {
    for (const f of filesCompiledBy(projectRoot, tscBin, path.join(projectRoot, config))) covered.add(f);
  }
  return { srcFiles, uncovered: srcFiles.filter((f) => !covered.has(f)) };
}

function checkTsconfigCoverage() {
  const { srcFiles, uncovered } = uncoveredFiles(root, "src/**/*.{ts,tsx}", TSCONFIGS);
  if (uncovered.length > 0) {
    fail(`${uncovered.length} src/ file(s) are not compiled by ANY of the four typecheck configs: ${uncovered.slice(0, 10).join(", ")}${uncovered.length > 10 ? ", ..." : ""}`);
  } else {
    console.log(`[check-native-coverage] every one of ${srcFiles.length} src/*.ts(x) file(s) is compiled by at least one of the four typecheck configs.`);
  }
}

function checkNoIosPaths() {
  const matches = fg.sync(
    ["**/ios/**", "**/*.xcodeproj/**", "**/*.xcworkspace/**", "**/Podfile", "**/*.podspec"],
    { cwd: root, dot: true, onlyFiles: false, ignore: ["node_modules/**", ".git/**"] }
  );
  if (matches.length > 0) {
    fail(`iOS project files/config found (B2-AC24 forbids any): ${matches.slice(0, 10).join(", ")}`);
  } else {
    console.log("[check-native-coverage] no ios/, *.xcodeproj, *.xcworkspace, Podfile or *.podspec path exists in the repo.");
  }
}

checkTsconfigCoverage();
checkNoIosPaths();

// A REAL negative control (review finding: the previous --self-test only
// checked that the four tsconfig files exist, which "proves the OPPOSITE
// direction" per its own comment). Builds a throwaway two-file, two-tsconfig
// project in a temp dir — one tsconfig covers both files, the other covers
// only one — and runs the exact `uncoveredFiles()` mechanism the real check
// above uses. A clean positive control (both configs cover both files) must
// report zero uncovered; the planted gap (one config omits one file) must be
// caught. This is the same shape as check-no-react-native.mjs's --self-test
// (plant a violation, prove it's caught, plus a clean control).
function selfTestCoverageMechanism() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "bobuttons-native-coverage-"));
  try {
    mkdirSync(path.join(tmp, "src"), { recursive: true });
    writeFileSync(path.join(tmp, "src", "covered.ts"), "export const covered = 1;\n");
    writeFileSync(path.join(tmp, "src", "gap.ts"), "export const gap = 1;\n");
    const baseConfig = { compilerOptions: { target: "es2022", module: "esnext", moduleResolution: "bundler", noEmit: true, skipLibCheck: true, strict: false } };
    writeFileSync(path.join(tmp, "tsconfig.full.json"), JSON.stringify({ ...baseConfig, include: ["src"] }, null, 2));
    writeFileSync(path.join(tmp, "tsconfig.partial.json"), JSON.stringify({ ...baseConfig, include: ["src/covered.ts"] }, null, 2));

    // Positive control: both files are covered when both configs are used
    // together (full.json alone already covers everything).
    const clean = uncoveredFiles(tmp, "src/**/*.ts", ["tsconfig.full.json", "tsconfig.partial.json"]);
    if (clean.uncovered.length !== 0) {
      fail(`self-test: clean positive control unexpectedly reported uncovered files: ${clean.uncovered.join(", ")}`);
    }

    // Negative control: using ONLY the partial config, "gap.ts" must be
    // reported as uncovered — proving the mechanism actually detects a gap,
    // not just that it ran.
    const gapped = uncoveredFiles(tmp, "src/**/*.ts", ["tsconfig.partial.json"]);
    if (!(gapped.uncovered.length === 1 && gapped.uncovered[0] === "src/gap.ts")) {
      fail(`self-test: planted coverage gap was NOT caught (expected exactly ["src/gap.ts"], got ${JSON.stringify(gapped.uncovered)}).`);
    } else {
      console.log("[check-native-coverage] self-test: planted coverage gap is caught, and a clean positive control passes.");
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (selfTest) {
  const existing = TSCONFIGS.every((c) => existsSync(path.join(root, c)));
  if (!existing) {
    fail("self-test: one of the four expected tsconfig.typecheck.*.json files is missing.");
  } else {
    console.log("[check-native-coverage] self-test: all four expected tsconfig.typecheck.*.json files are present and were used above.");
  }
  selfTestCoverageMechanism();
}

if (failed) process.exit(1);
console.log("[check-native-coverage] PASS");
