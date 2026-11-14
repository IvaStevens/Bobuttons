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

// BOBUTTONS-4 NARROWS B2-AC21 from a blanket subpath ban to a four-key
// allowlist — recorded explicitly here and in the PR, per that AC's own
// requirement to call out the reversal. B2-AC21's underlying rationale (the
// react-native condition must never live behind a platform-named subpath
// like "./native") is preserved per key below, not relaxed: every one of
// these four keys still declares "react-native" FIRST inside its OWN
// conditions object, so a React Native Jest environment (which activates
// both "require" and "react-native" at once) still resolves the native
// bundle for every key, not just ".". No wildcard/pattern key is admitted —
// exactly these four, by exact string.
const ICON_PACK_KEYS = ["./icons/animal", "./icons/basic", "./icons/food", "./icons/shapes"];

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
  const allowedKeys = new Set([".", "./package.json", ...ICON_PACK_KEYS]);
  if (!pkg.exports || !pkg.exports["."] || !pkg.exports["./package.json"]) {
    fail(`package.json "exports" must expose at least "." and "./package.json" (B1-AC10).`);
  } else {
    const keys = Object.keys(pkg.exports);
    const extra = keys.filter((k) => !allowedKeys.has(k));
    if (extra.length > 0) {
      fail(
        `package.json "exports" has extra entries beyond the allowlist (".", "./package.json", ${ICON_PACK_KEYS.map((k) => `"${k}"`).join(", ")}): ${extra.join(", ")} (B2-AC21, as narrowed by BOBUTTONS-4: exactly these four pack subpaths are admitted, no wildcard, no platform-named subpath like "./native").`
      );
    }
    for (const key of ICON_PACK_KEYS) {
      if (!keys.includes(key)) {
        fail(`package.json "exports" is missing the required icon pack key "${key}" (BOBUTTONS-4).`);
      }
    }
  }
  checkReactNativeCondition(".", pkg.exports && pkg.exports["."], { rootOnlyFieldCheck: true });
  for (const key of ICON_PACK_KEYS) {
    if (pkg.exports && pkg.exports[key]) {
      checkReactNativeCondition(key, pkg.exports[key], { rootOnlyFieldCheck: false });
    }
  }
}

// B2-AC21/B2-AC7/B2-AC9: the "react-native" condition must exist inside a
// conditions object, be declared FIRST (conditions match in object order,
// and a React Native Jest environment activates both "require" and
// "react-native" at once — putting "require" first would hand a native test
// environment the web CJS bundle). This structural check needs only
// package.json, so it runs in staticChecks(); whether ".default"/".types"
// actually resolve to shipped files needs `dist/`, which does not exist yet
// at static-check time (verify.mjs runs this step BEFORE `npm run build`,
// and dist/ is git-ignored) — that resolution check is deferred to
// checkReactNativeConditionResolves(), called from tarballChecks() where a
// build has already happened. `rootOnlyFieldCheck` scopes the
// `pkg["react-native"] === rn.default` top-level-field assertion to "."
// only — the four icon pack keys have no equivalent top-level legacy field
// and never will (B1-AC10 forbids a legacy-field fallback for subpaths).
function checkReactNativeCondition(key, dot, { rootOnlyFieldCheck }) {
  if (!dot || typeof dot !== "object") {
    fail(`package.json exports["${key}"] must be a conditions object (got ${JSON.stringify(dot)}).`);
    return;
  }
  const conditionKeys = Object.keys(dot);
  if (conditionKeys[0] !== "react-native") {
    fail(`package.json exports["${key}"]'s "react-native" condition must be declared FIRST, found order: ${conditionKeys.join(", ")}.`);
  }
  const rn = dot["react-native"];
  if (!rn || typeof rn !== "object" || !rn.default || !rn.types) {
    fail(`package.json exports["${key}"]["react-native"] must be an object with "default" and "types", got ${JSON.stringify(rn)}.`);
    return;
  }
  if (rootOnlyFieldCheck && pkg["react-native"] !== rn.default) {
    fail(`package.json top-level "react-native" field ("${pkg["react-native"]}") must match exports["."]["react-native"].default ("${rn.default}").`);
  }
}

// Build-output half of the react-native condition check: `default`/`types`
// must resolve to files that are actually shipped. Only meaningful once
// `dist/` exists (after `npm run build`), so this is called from
// tarballChecks(), never from staticChecks(). Runs for "." and all four icon
// pack keys.
function checkReactNativeConditionResolves() {
  for (const key of [".", ...ICON_PACK_KEYS]) {
    const dot = pkg.exports && pkg.exports[key];
    const rn = dot && dot["react-native"];
    if (!rn || typeof rn !== "object") continue; // already reported by checkReactNativeCondition()
    for (const [field, value] of [["default", rn.default], ["types", rn.types]]) {
      if (!value) continue;
      const rel = value.replace(/^\.\//, "");
      if (!existsSync(path.join(root, rel))) {
        fail(`package.json exports["${key}"]["react-native"].${field} ("${value}") does not resolve to a shipped file (run \`npm run build\` first if this is unexpected).`);
      }
    }
  }
}

function tarballChecks() {
  checkReactNativeConditionResolves();
  const outDir = path.join(root, ".verify-out");
  const metaPath = path.join(outDir, "pack.json");
  if (!existsSync(metaPath)) {
    fail(`expected ${metaPath} — run "npm run pack" (the "pack" step of verify.mjs) before --tarball checks.`);
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
  //
  // BOBUTTONS-4: one deep-import specifier per icon pack bundle is probed in
  // ADDITION to the root's, as a SEPARATE node spawn each — node aborts at
  // the first unresolved specifier in a module graph, so batching all five
  // deep imports into one file/one process would only prove the FIRST one
  // is blocked and say nothing about the other four.
  const deepImportSpecifiers = [
    "bobuttons/dist/index.mjs",
    ...ICON_PACK_KEYS.map((key) => `bobuttons/dist/icons/${key.replace("./icons/", "")}.mjs`),
  ];
  const tmp = mkdtempSync(path.join(os.tmpdir(), "bobuttons-exports-"));
  try {
    execFileSync("tar", ["-xf", tarballPath, "-C", tmp]);
    const nodeModules = path.join(tmp, "node_modules");
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(path.join(tmp, "package"), path.join(nodeModules, "bobuttons"), "dir");

    for (const specifier of deepImportSpecifiers) {
      const probe = path.join(tmp, `probe-${specifier.replace(/[^a-z0-9]+/gi, "-")}.mjs`);
      writeFileSync(probe, `import "${specifier}";\n`);
      try {
        execFileSync("node", [probe], { stdio: "pipe", cwd: tmp });
        fail(`deep import "${specifier}" unexpectedly succeeded (expected ERR_PACKAGE_PATH_NOT_EXPORTED).`);
      } catch (err) {
        const out = String(err.stderr || "");
        if (!/ERR_PACKAGE_PATH_NOT_EXPORTED/.test(out)) {
          fail(`deep import "${specifier}" failed for an unexpected reason (expected ERR_PACKAGE_PATH_NOT_EXPORTED): ${out.slice(0, 300)}`);
        }
      }
    }

    // Typecheck half: must fail with TS2307 under both resolutions, for
    // EVERY specifier individually (per-specifier TS2307, not "anywhere in
    // the output" — a single batched file could pass with three of four
    // pack internals wide open if only one import happened to be checked
    // first and the scan stopped at the first match).
    const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
    const variants = [
      { label: "bundler", options: { moduleResolution: "bundler", module: "esnext" } },
      { label: "node16", options: { moduleResolution: "node16", module: "node16" } },
    ];
    for (const specifier of deepImportSpecifiers) {
      const slug = specifier.replace(/[^a-z0-9]+/gi, "-");
      const deepImportTs = path.join(tmp, `deep-import-${slug}.ts`);
      writeFileSync(deepImportTs, `import { Button } from "${specifier}";\nexport { Button };\n`);
      for (const variant of variants) {
        const tsconfigPath = path.join(tmp, `tsconfig.${slug}.${variant.label}.json`);
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
              include: [path.basename(deepImportTs)],
            },
            null,
            2
          )
        );
        try {
          execFileSync(process.execPath, [tscBin, "--noEmit", "-p", tsconfigPath], { stdio: "pipe", cwd: tmp });
          fail(`deep import "${specifier}" unexpectedly typechecked under moduleResolution "${variant.label}" (expected TS2307).`);
        } catch (err) {
          const out = String(err.stdout || "") + String(err.stderr || "");
          if (!/TS2307/.test(out) || !out.includes(specifier)) {
            fail(`deep-import typecheck for "${specifier}" failed for an unexpected reason under "${variant.label}" (expected TS2307 naming that specifier): ${out.slice(0, 500)}`);
          }
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
