#!/usr/bin/env node
// Two modes:
//   (default)   static checks against package.json only.
//   --tarball   checks the `npm pack` tarball: pack-contents allowlist,
//               exports-encapsulation, and an executed `npm publish --dry-run`
//               that must exit non-zero.
//
// `private: true` doesn't affect the dry-run exit code (only prepublishOnly
// does), so it is asserted statically, separately from the executed dry-run.
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const tarballMode = process.argv.includes("--tarball");
let failed = false;
function fail(msg) {
  console.error(`[check-package-integrity] FAIL: ${msg}`);
  failed = true;
}

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

function staticChecks() {
  if (pkg.private !== true) {
    fail(`package.json "private" must be exactly true, got: ${JSON.stringify(pkg.private)}`);
  }
  if (!pkg.scripts || typeof pkg.scripts.prepublishOnly !== "string" || pkg.scripts.prepublishOnly.length === 0) {
    fail(`package.json must declare a non-empty "scripts.prepublishOnly" that exits non-zero.`);
  }
  if (!pkg.scripts || pkg.scripts.prepack !== "npm run build") {
    fail(`package.json "scripts.prepack" must be "npm run build", got: ${JSON.stringify(pkg.scripts && pkg.scripts.prepack)}`);
  }
  if (!pkg.exports || !pkg.exports["."] || !pkg.exports["./package.json"]) {
    fail(`package.json "exports" must expose exactly "." and "./package.json" (AC10).`);
  } else {
    const keys = Object.keys(pkg.exports);
    const extra = keys.filter((k) => k !== "." && k !== "./package.json");
    if (extra.length > 0) {
      fail(`package.json "exports" has extra entries beyond "." and "./package.json": ${extra.join(", ")}`);
    }
  }
}

function tarballChecks() {
  const outDir = path.join(root, ".verify-out");
  const metaPath = path.join(outDir, "pack.json");
  if (!existsSync(metaPath)) {
    fail(`expected ${metaPath} — run "npm run pack" (step 13 of verify) before --tarball checks.`);
    return;
  }
  const packMeta = JSON.parse(readFileSync(metaPath, "utf8"))[0];
  const tarballName = packMeta.filename.replace("@", "").replace("/", "-");
  const tarballPath = path.join(outDir, tarballName);
  if (!existsSync(tarballPath)) {
    fail(`expected tarball at ${tarballPath}`);
    return;
  }

  // Only dist/** and the manifest/readme/license may appear in the tarball.
  const allowedTop = new Set(["package.json", "README.md", "LICENSE"]);
  for (const entry of packMeta.files) {
    const rel = entry.path.replace(/^package\//, "");
    const top = rel.split("/")[0];
    if (!allowedTop.has(top) && top !== "dist") {
      fail(`tarball contains unexpected path outside the allowlist: ${rel}`);
    }
  }

  // Exports-encapsulation: a deep import must fail at runtime and at typecheck.
  // Import by bare specifier from a throwaway node_modules, so resolution goes
  // through the real "exports" map; an absolute path would bypass it and fail
  // regardless of the map.
  const tmp = mkdtempSync(path.join(os.tmpdir(), "bobuttons-exports-"));
  try {
    execFileSync("tar", ["-xf", tarballPath, "-C", tmp]);
    const nodeModules = path.join(tmp, "node_modules");
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(path.join(tmp, "package"), path.join(nodeModules, "bobuttons"), "dir");

    const probe = path.join(tmp, "probe.mjs");
    writeFileSync(probe, `import "bobuttons/dist/index.mjs";\n`);
    try {
      execFileSync("node", [probe], { stdio: "pipe", cwd: tmp });
      fail("deep import unexpectedly succeeded (expected ERR_PACKAGE_PATH_NOT_EXPORTED).");
    } catch (err) {
      const out = String(err.stderr || "");
      if (!/ERR_PACKAGE_PATH_NOT_EXPORTED/.test(out)) {
        fail(`deep import failed for an unexpected reason (expected ERR_PACKAGE_PATH_NOT_EXPORTED): ${out.slice(0, 300)}`);
      }
    }

    // Typecheck half: must fail with TS2307 under both resolutions.
    const deepImportTs = path.join(tmp, "deep-import.ts");
    writeFileSync(deepImportTs, `import { Button } from "bobuttons/dist/index.mjs";\nexport { Button };\n`);
    const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
    const variants = [
      { label: "bundler", options: { moduleResolution: "bundler", module: "esnext" } },
      { label: "node16", options: { moduleResolution: "node16", module: "node16" } },
    ];
    for (const variant of variants) {
      const tsconfigPath = path.join(tmp, `tsconfig.${variant.label}.json`);
      writeFileSync(
        tsconfigPath,
        JSON.stringify(
          {
            compilerOptions: {
              ...variant.options,
              target: "es2022",
              strict: false,
              noEmit: true,
              skipLibCheck: true,
            },
            include: ["deep-import.ts"],
          },
          null,
          2
        )
      );
      try {
        execFileSync(process.execPath, [tscBin, "--noEmit", "-p", tsconfigPath], { stdio: "pipe", cwd: tmp });
        fail(`deep import unexpectedly typechecked under moduleResolution "${variant.label}" (expected TS2307).`);
      } catch (err) {
        const out = String(err.stdout || "") + String(err.stderr || "");
        if (!/TS2307/.test(out)) {
          fail(`deep-import typecheck failed for an unexpected reason under "${variant.label}" (expected TS2307): ${out.slice(0, 500)}`);
        }
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  // Run against the project directory so prepublishOnly fires.
  try {
    execFileSync("npm", ["publish", "--dry-run"], { cwd: root, stdio: "pipe" });
    fail('"npm publish --dry-run" unexpectedly exited 0 — prepublishOnly must block it.');
  } catch {
    // non-zero exit is the required outcome
  }
}

staticChecks();
if (tarballMode) tarballChecks();

if (failed) process.exit(1);
console.log(`[check-package-integrity] PASS${tarballMode ? " (tarball)" : " (static)"}`);
