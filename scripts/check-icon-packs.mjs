#!/usr/bin/env node
// BOBUTTONS-4's icon-pack gate. Three modes:
//   (default)     static checks — no build needed. Cheap, runs early in
//                 verify (right after check-themes) so generator drift,
//                 fidelity, naming and source-isolation failures surface
//                 before any build/typecheck/storybook cost is spent.
//   --artifacts   checks the BUILT bundles and the PACKED tarball. Runs
//                 late in verify (after the tarball integrity step) because
//                 it needs a real `npm pack` to build a real consumer
//                 bundle from.
//   --self-test   exercises the drop-and-record path (an absent name) and
//                 the hard-fail path (an unresolvable, unallowlisted
//                 Feather name) against the real resolver, without
//                 mutating any committed file.
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import os from "node:os";
import path from "node:path";
import fg from "fast-glob";
import {
  root,
  PACK_NAMES,
  readManifest,
  lucideVersion,
  buildAliasMap,
  resolveName,
  loadGlyphShape,
  parseFeatherNames,
} from "./generate-icon-packs.mjs";

const mode = process.argv.includes("--artifacts") ? "artifacts" : process.argv.includes("--self-test") ? "self-test" : "static";

let failed = false;
function fail(msg) {
  console.error(`[check-icon-packs] FAIL: ${msg}`);
  failed = true;
}
function ok(msg) {
  console.log(`[check-icon-packs] ${msg}`);
}

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const manifest = readManifest();

// ---------------------------------------------------------------------------
// Shared helper: extract a generated glyph module's data object back into a
// plain JS value. The generator emits `export const xGlyphs: Record<...> =
// {<quoted-key JSON-stringified-value pairs>};`, which — keys and values
// both coming from JSON.stringify — is valid JSON once the TS type
// annotation is stripped, so no TS loader is needed to read it back.
function readGeneratedGlyphs(packName) {
  const filePath = path.join(root, `src/icons/glyphs/${packName}.generated.ts`);
  const text = readFileSync(filePath, "utf8");
  const match = /export const \w+Glyphs: Record<[^>]*> = (\{[\s\S]*\});\s*$/.exec(text.trim());
  if (!match) throw new Error(`could not parse the generated glyph object out of ${filePath}`);
  // The generator emits a trailing comma after the last entry (valid JS
  // object-literal syntax, invalid JSON) — strip it before parsing.
  const jsonish = match[1].replace(/,(\s*\})/g, "$1");
  return JSON.parse(jsonish);
}

// ---------------------------------------------------------------------------
// STATIC CHECKS
// ---------------------------------------------------------------------------

function checkVersionPin() {
  const installed = lucideVersion();
  const declared = pkg.devDependencies && pkg.devDependencies.lucide;
  if (manifest.lucideVersion !== installed || declared !== installed) {
    fail(
      `version pin disagreement: scripts/icon-packs.json.lucideVersion="${manifest.lucideVersion}", installed lucide="${installed}", package.json devDependencies.lucide="${declared}" — all three must agree.`
    );
    return;
  }
  ok(`version pin agreement: lucide ${installed} (manifest, installed, and package.json devDependency all agree).`);
}

function checkGeneratorNoDiff() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "bobuttons-icon-packs-gen-"));
  try {
    execFileSync("node", [path.join(root, "scripts/generate-icon-packs.mjs"), "--out", tmp], { stdio: "pipe" });
    for (const packName of PACK_NAMES) {
      const rel = `src/icons/glyphs/${packName}.generated.ts`;
      const committed = readFileSync(path.join(root, rel), "utf8");
      const generated = readFileSync(path.join(tmp, rel), "utf8");
      if (committed !== generated) {
        fail(`${rel} has drifted from the generator output. Run "npm run generate-icon-packs:write".`);
      }
    }
    if (!failed) ok("generator no-diff: all four generated glyph modules match a fresh run of the generator.");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Fidelity: independently re-resolve every included name against the
// INSTALLED lucide package and deep-compare its shape to what is actually
// committed. This is deliberately a SEPARATE check from the no-diff check
// above — a generator that only agrees with its own re-run proves
// self-consistency, not upstream provenance (e.g. a generator bug that
// mis-serialises the SAME wrong value every time would pass no-diff but
// fail this).
async function checkFidelity() {
  const aliasMap = buildAliasMap();
  for (const packName of PACK_NAMES) {
    const committed = readGeneratedGlyphs(packName);
    const packEntry = manifest.packs[packName];
    for (const { name, canonicalSlug } of packEntry.included) {
      const resolved = resolveName(name, aliasMap);
      if (!resolved || resolved.canonicalSlug !== canonicalSlug) {
        fail(`fidelity: "${name}" in pack "${packName}" no longer resolves to canonicalSlug "${canonicalSlug}" against the installed lucide.`);
        continue;
      }
      const freshShape = await loadGlyphShape(canonicalSlug);
      const committedShape = committed[name];
      if (JSON.stringify(freshShape) !== JSON.stringify(committedShape)) {
        fail(`fidelity: committed glyph data for "${name}" (pack "${packName}") does not match the installed lucide package's "${canonicalSlug}".`);
      }
    }
  }
  if (!failed) ok("fidelity: every committed glyph deep-compares equal to the installed lucide package.");
}

function checkNameSweepAndManifestConsistency() {
  const aliasMap = buildAliasMap();
  for (const packName of PACK_NAMES) {
    const packEntry = manifest.packs[packName];
    const expectedIncluded = [];
    const expectedAbsent = [];
    for (const name of packEntry.listed) {
      const resolved = resolveName(name, aliasMap);
      if (resolved) expectedIncluded.push(name);
      else expectedAbsent.push(name);
    }
    const actualIncluded = packEntry.included.map((e) => e.name);
    if (JSON.stringify(expectedIncluded) !== JSON.stringify(actualIncluded) || JSON.stringify(expectedAbsent) !== JSON.stringify(packEntry.absent)) {
      fail(
        `pack "${packName}": manifest's included/absent split does not match a fresh resolution sweep. Run "npm run generate-icon-packs:write".`
      );
    }
    if (packEntry.count !== packEntry.included.length) {
      fail(`pack "${packName}": manifest "count" (${packEntry.count}) does not match included.length (${packEntry.included.length}).`);
    }
  }
  if (!failed) ok(`name sweep: all ${PACK_NAMES.length} packs' included/absent/count fields match a fresh resolution sweep.`);
}

function checkNameCorrections() {
  if (!Array.isArray(manifest.nameCorrections) || manifest.nameCorrections.length === 0) {
    fail("scripts/icon-packs.json.nameCorrections must be a non-empty array (the plan-approval typo fixes, recorded as data).");
    return;
  }
  for (const entry of manifest.nameCorrections) {
    if (!entry.from || !entry.to) {
      fail(`nameCorrections entry missing "from"/"to": ${JSON.stringify(entry)}`);
    }
  }
  if (!failed) ok(`nameCorrections: ${manifest.nameCorrections.length} recorded correction(s).`);
}

function checkFeatherCrossCheck() {
  const aliasMap = buildAliasMap();
  const featherNames = parseFeatherNames();
  const unmappableAllowed = new Map((manifest.featherUnmappable || []).map((e) => [e.name, e.reason]));
  const shippedSlugs = new Set();
  for (const packName of PACK_NAMES) {
    for (const { canonicalSlug } of manifest.packs[packName].included) shippedSlugs.add(canonicalSlug);
  }
  const freshFeatherDerived = [];
  for (const featherName of featherNames) {
    const resolved = resolveName(featherName, aliasMap);
    if (!resolved) {
      if (unmappableAllowed.has(featherName)) continue;
      fail(
        `Feather-derived name "${featherName}" does not resolve through the alias map and is not in featherUnmappable. This is a hard-fail condition the generator itself enforces — re-run "npm run generate-icon-packs:write" and inspect its error, or add a featherUnmappable entry with a reason.`
      );
      continue;
    }
    if (shippedSlugs.has(resolved.canonicalSlug)) freshFeatherDerived.push(resolved.canonicalSlug);
  }
  freshFeatherDerived.sort();
  if (JSON.stringify(freshFeatherDerived) !== JSON.stringify(manifest.featherDerived || [])) {
    fail(`manifest.featherDerived (${JSON.stringify(manifest.featherDerived)}) does not match a fresh sweep (${JSON.stringify(freshFeatherDerived)}). Run "npm run generate-icon-packs:write".`);
  }

  // Cross-check against THIRD-PARTY-NOTICES.md: every Feather-derived name
  // must be named there, and the Feather MIT notice text (a body-identity
  // tripwire, not just a mention of the word "Feather") must be present.
  const noticesPath = path.join(root, "THIRD-PARTY-NOTICES.md");
  const notices = existsSync(noticesPath) ? readFileSync(noticesPath, "utf8") : "";
  for (const slug of freshFeatherDerived) {
    if (!notices.includes(slug)) {
      fail(`THIRD-PARTY-NOTICES.md does not name the Feather-derived slug "${slug}".`);
    }
  }
  if (!/Cole Bemis/.test(notices)) {
    fail(`THIRD-PARTY-NOTICES.md is missing the Feather MIT copyright notice ("Cole Bemis").`);
  }
  if (!failed) ok(`Feather cross-check: ${freshFeatherDerived.length} Feather-derived slug(s) (${freshFeatherDerived.join(", ")}), all named in THIRD-PARTY-NOTICES.md.`);
}

function checkExportsKeysMatchPacks() {
  const exportKeys = Object.keys(pkg.exports || {});
  const expectedPackKeys = PACK_NAMES.map((n) => `./icons/${n}`);
  const missing = expectedPackKeys.filter((k) => !exportKeys.includes(k));
  const extra = exportKeys.filter((k) => k.startsWith("./icons/") && !expectedPackKeys.includes(k));
  if (missing.length > 0 || extra.length > 0) {
    fail(`package.json "exports" icon pack keys do not match PACK_NAMES exactly — missing: ${missing.join(", ") || "(none)"}, extra: ${extra.join(", ") || "(none)"}.`);
    return;
  }
  ok(`exports keys == manifest packs: ${expectedPackKeys.join(", ")}.`);
}

// Hand-rolled bound compare for a ">=X.Y.Z <A.B.C" range — semver is only a
// transitive dependency here, not a direct one, and this range shape is
// simple enough not to need it.
function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) throw new Error(`not a parseable version: "${v}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}
function versionInRange(version, range) {
  const m = /^>=\s*([\d.]+)\s*<\s*([\d.]+)$/.exec(range.trim());
  if (!m) throw new Error(`unsupported range shape: "${range}" (expected ">=X <Y")`);
  const v = parseVersion(version);
  return compareVersions(v, parseVersion(m[1])) >= 0 && compareVersions(v, parseVersion(m[2])) < 0;
}

function checkNativePeerDeclaration() {
  const expected = manifest.nativePeer;
  if (!expected || !expected.name || !expected.range || !expected.pinnedDevVersion) {
    fail("scripts/icon-packs.json.nativePeer must declare name/range/pinnedDevVersion.");
    return;
  }
  const declaredRange = pkg.peerDependencies && pkg.peerDependencies[expected.name];
  const isOptional = Boolean(pkg.peerDependenciesMeta && pkg.peerDependenciesMeta[expected.name] && pkg.peerDependenciesMeta[expected.name].optional === true);
  const pinnedDev = pkg.devDependencies && pkg.devDependencies[expected.name];
  if (declaredRange !== expected.range) {
    fail(`package.json peerDependencies["${expected.name}"]="${declaredRange}" does not match manifest's nativePeer.range="${expected.range}".`);
  }
  if (!isOptional) {
    fail(`package.json peerDependenciesMeta["${expected.name}"].optional must be true.`);
  }
  if (pinnedDev !== expected.pinnedDevVersion) {
    fail(`package.json devDependencies["${expected.name}"]="${pinnedDev}" does not match manifest's nativePeer.pinnedDevVersion="${expected.pinnedDevVersion}".`);
  }
  try {
    if (!versionInRange(expected.pinnedDevVersion, expected.range)) {
      fail(`pinned devDependency version "${expected.pinnedDevVersion}" is outside the declared peer range "${expected.range}".`);
    }
  } catch (e) {
    fail(`could not evaluate nativePeer range: ${e.message}`);
  }
  if (!failed) ok(`native peer declaration: ${expected.name} optional peer "${expected.range}", pinned devDependency "${expected.pinnedDevVersion}" (in range).`);
}

// Every specifier (static import / require / dynamic import) in a file's text.
const SPECIFIER_RE = /(?:from\s+|require\(\s*|import\(\s*|\bimport\s+)["']([^"']+)["']/g;
function specifiersIn(text) {
  const out = [];
  let m;
  SPECIFIER_RE.lastIndex = 0;
  while ((m = SPECIFIER_RE.exec(text))) out.push(m[1]);
  return out;
}

// Two-way source isolation (the portable, baseline-free replacement for a
// permanent sha256 gate — see README/PR): (a) nothing OUTSIDE src/icons/**
// may reference "icons/" in any import/require/dynamic-import specifier —
// this is what proves nothing under src/icons/** is reachable from
// src/index.ts, i.e. the packs add zero bytes to the three main bundles by
// CONSTRUCTION, not just by today's measurement; (b) src/icons/** may import
// only within itself (relative specifiers) plus react/react's jsx-runtime/
// react-native-svg — no @tamagui/*, no lucide, no reaching back into
// src/components|internal|provider|tokens|themes.
function checkTwoWaySourceIsolation() {
  const allSrcFiles = fg.sync(["**/*.{ts,tsx}"], { cwd: path.join(root, "src") });
  // Stories and tests live beside the packs but are dev-only: no tsup entry
  // reaches them, so they may import Storybook/vitest/Icon. They are exempt
  // from the (b) allowlist below, not from (a) — nothing outside src/icons/**
  // may import a pack, and a story is not a way around that.
  const isDevOnly = (rel) => /\.(stories|test)\.tsx?$/.test(rel);
  const iconFiles = allSrcFiles.filter((rel) => rel.startsWith("icons/") && !isDevOnly(rel));
  const otherFiles = allSrcFiles.filter((rel) => !rel.startsWith("icons/"));

  for (const rel of otherFiles) {
    const text = readFileSync(path.join(root, "src", rel), "utf8");
    for (const specifier of specifiersIn(text)) {
      if (specifier.includes("icons/")) {
        fail(`src/${rel} references "icons/" in specifier "${specifier}" — nothing outside src/icons/** may import a pack (opt-in/byte-identity guarantee).`);
      }
    }
  }

  const ALLOWED_BARE = new Set(["react", "react/jsx-runtime", "react-native-svg"]);
  for (const rel of iconFiles) {
    const text = readFileSync(path.join(root, "src", rel), "utf8");
    for (const specifier of specifiersIn(text)) {
      if (specifier.startsWith(".")) continue; // internal to src/icons/**
      if (!ALLOWED_BARE.has(specifier)) {
        fail(`src/icons/${rel} imports "${specifier}", outside the allowed bare-specifier set (${[...ALLOWED_BARE].join(", ")}) for src/icons/**.`);
      }
    }
  }
  if (!failed) ok(`two-way source isolation: ${otherFiles.length} non-icon file(s) reference no "icons/" specifier; ${iconFiles.length} icon file(s) import only within themselves plus react/react-native-svg.`);
}

function checkNoSrcLucideImport() {
  const allSrcFiles = fg.sync(["**/*.{ts,tsx}"], { cwd: path.join(root, "src") });
  const offenders = [];
  for (const rel of allSrcFiles) {
    const text = readFileSync(path.join(root, "src", rel), "utf8");
    if (specifiersIn(text).some((s) => s === "lucide" || s.startsWith("lucide/"))) offenders.push(rel);
  }
  if (offenders.length > 0) {
    fail(`src/ imports "lucide" directly (only scripts/generate-icon-packs.mjs may): ${offenders.join(", ")}`);
    return;
  }
  ok("no src/** file imports lucide directly (only the generator does).");
}

function runStaticChecks() {
  checkVersionPin();
  checkGeneratorNoDiff();
  checkNameSweepAndManifestConsistency();
  checkNameCorrections();
  checkExportsKeysMatchPacks();
  checkNativePeerDeclaration();
  checkTwoWaySourceIsolation();
  checkNoSrcLucideImport();
  return checkFidelity().then(() => checkFeatherCrossCheck());
}

// ---------------------------------------------------------------------------
// --artifacts: checks over the BUILT bundles and the PACKED tarball.
// ---------------------------------------------------------------------------

// Icons listed by exactly one pack (used as presence/absence needles —
// shared names, e.g. fish/shrimp and circle/star, are deliberately excluded
// from the ABSENCE side of this check since their presence in more than one
// pack is correct, not a leak).
function exclusiveNamesByPack() {
  const nameToPacks = new Map();
  for (const packName of PACK_NAMES) {
    for (const { name } of manifest.packs[packName].included) {
      if (!nameToPacks.has(name)) nameToPacks.set(name, []);
      nameToPacks.get(name).push(packName);
    }
  }
  const exclusive = {};
  for (const packName of PACK_NAMES) exclusive[packName] = [];
  for (const [name, packs] of nameToPacks) {
    if (packs.length === 1) exclusive[packs[0]].push(name);
  }
  return exclusive;
}

function checkBundleNeedles() {
  const exclusive = exclusiveNamesByPack();
  const distDir = path.join(root, "dist");
  for (const packName of PACK_NAMES) {
    for (const ext of ["mjs", "cjs", "native.js"]) {
      const bundlePath = path.join(distDir, "icons", `${packName}.${ext}`);
      if (!existsSync(bundlePath)) {
        fail(`expected dist/icons/${packName}.${ext} to exist — run \`npm run build\` first.`);
        continue;
      }
      const text = readFileSync(bundlePath, "utf8");
      for (const name of manifest.packs[packName].included.map((e) => e.name)) {
        if (!text.includes(JSON.stringify(name))) {
          fail(`dist/icons/${packName}.${ext} is missing its own icon "${name}".`);
        }
      }
      for (const otherPack of PACK_NAMES) {
        if (otherPack === packName) continue;
        for (const foreignName of exclusive[otherPack]) {
          if (text.includes(JSON.stringify(foreignName))) {
            fail(`dist/icons/${packName}.${ext} contains "${foreignName}", which belongs exclusively to pack "${otherPack}" — pack isolation leak.`);
          }
        }
      }
    }
  }
  if (!failed) ok("bundle needles: every pack bundle contains only its own icons (shared icons excepted, as expected).");
}

function checkNoLicenceCommentLost() {
  const distDir = path.join(root, "dist");
  for (const packName of PACK_NAMES) {
    for (const ext of ["mjs", "cjs"]) {
      const bundlePath = path.join(distDir, "icons", `${packName}.${ext}`);
      if (!existsSync(bundlePath)) continue;
      const text = readFileSync(bundlePath, "utf8");
      if (!text.includes("@license lucide")) {
        fail(`dist/icons/${packName}.${ext} is missing the "@license lucide" banner comment.`);
      }
    }
  }
  if (!failed) ok("licence-comment survival: the lucide @license banner survives the build in every web pack bundle.");
}

function checkRootBundlesHaveNoPackLiteral() {
  const distDir = path.join(root, "dist");
  // One distinctive, exclusive name per pack, each unlikely to appear as a
  // substring of anything else Bobuttons already bundles.
  const probes = ["paw-print", "circle-check", "cupcake", "astroid"];
  for (const rootBundle of ["index.mjs", "index.cjs", "index.native.js"]) {
    const bundlePath = path.join(distDir, rootBundle);
    if (!existsSync(bundlePath)) continue;
    const text = readFileSync(bundlePath, "utf8");
    for (const probe of probes) {
      if (text.includes(probe)) {
        fail(`dist/${rootBundle} unexpectedly contains "${probe}" — an icon pack literal leaked into a main bundle.`);
      }
    }
  }
  if (!failed) ok(`root bundles contain none of the pack-name probes (${probes.join(", ")}) — the packs add zero reachable bytes to dist/index.*.`);
}

function checkPerBundleBareSpecifiers() {
  const distDir = path.join(root, "dist");
  const ALLOWED_WEB = new Set(["react", "react/jsx-runtime"]);
  const ALLOWED_NATIVE = new Set(["react", "react/jsx-runtime", "react-native-svg"]);
  for (const packName of PACK_NAMES) {
    for (const [ext, allowed] of [["mjs", ALLOWED_WEB], ["cjs", ALLOWED_WEB], ["native.js", ALLOWED_NATIVE]]) {
      const bundlePath = path.join(distDir, "icons", `${packName}.${ext}`);
      if (!existsSync(bundlePath)) continue;
      const text = readFileSync(bundlePath, "utf8");
      const specs = new Set(specifiersIn(text).filter((s) => !s.startsWith(".")));
      const extra = [...specs].filter((s) => !allowed.has(s));
      if (extra.length > 0) {
        fail(`dist/icons/${packName}.${ext} imports unexpected bare specifier(s): ${extra.join(", ")} (expected a subset of ${[...allowed].join(", ")}).`);
      }
    }
  }
  if (!failed) ok("per-bundle bare specifiers: every pack bundle's import set is a subset of its platform's allowed peers.");
}

function checkNoCrossPlatformColourLeak() {
  const distDir = path.join(root, "dist");
  for (const packName of PACK_NAMES) {
    const nativePath = path.join(distDir, "icons", `${packName}.native.js`);
    if (existsSync(nativePath) && readFileSync(nativePath, "utf8").includes("currentColor")) {
      fail(`dist/icons/${packName}.native.js contains "currentColor" — native has no such keyword (web-only colour seam leaked).`);
    }
    for (const ext of ["mjs", "cjs"]) {
      const webPath = path.join(distDir, "icons", `${packName}.${ext}`);
      if (existsSync(webPath) && /#000\b/.test(readFileSync(webPath, "utf8"))) {
        fail(`dist/icons/${packName}.${ext} contains "#000" — that is the native-only colour fallback.`);
      }
    }
  }
  if (!failed) ok("no cross-platform colour-seam leak: no \"currentColor\" on native, no \"#000\" on web, across all four packs.");
}

// A real consumer bundle, built with esbuild from the PACKED tarball (the
// mechanism check-scratch-install.mjs already uses) — the mechanism-level
// proof of AC16's "a consumer that imports only one pack's subpath ships
// only that pack's glyph data", not a scan of the library's own dist/ alone.
// Two probes (component-only vs. component+record) are the pack-vs-icon
// granularity evidence: bundling a single named icon still pulls in the
// whole pack's data because the pack module is one data object, not one
// subpath per icon (AC16's own text names the four pack subpaths, not a
// subpath per icon — see the PR's AC-text-deviation note).
function buildConsumerProbe() {
  const packMetaPath = path.join(root, ".verify-out/pack.json");
  if (!existsSync(packMetaPath)) {
    fail(`expected ${packMetaPath} — run "npm run pack" before --artifacts.`);
    return;
  }
  const packMeta = JSON.parse(readFileSync(packMetaPath, "utf8"))[0];
  const tarballPath = path.join(root, ".verify-out", packMeta.filename.replace("@", "").replace("/", "-"));
  if (!existsSync(tarballPath)) {
    fail(`expected tarball at ${tarballPath}`);
    return;
  }

  // Inside the repo, not os.tmpdir(): esbuild's/Node's module resolution
  // walks UP the file's ancestor directories to find node_modules, so the
  // temp project must be a descendant of this repo to resolve `react` from
  // the repo's own install (same reasoning as check-native-bundle.mjs's
  // Metro probe and check-scratch-install.mjs's fixture).
  mkdirSync(path.join(root, ".verify-out"), { recursive: true });
  const tmp = mkdtempSync(path.join(root, ".verify-out", "icon-packs-artifact-"));
  try {
    execFileSync("tar", ["-xf", tarballPath, "-C", tmp]);
    const nodeModules = path.join(tmp, "node_modules");
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(path.join(tmp, "package"), path.join(nodeModules, "bobuttons"), "dir");

    const componentOnlyEntry = path.join(tmp, "component-only.mjs");
    writeFileSync(componentOnlyEntry, `export { Fish } from "bobuttons/icons/food";\n`);
    const componentAndRecordEntry = path.join(tmp, "component-and-record.mjs");
    writeFileSync(componentAndRecordEntry, `export { Fish, foodIcons } from "bobuttons/icons/food";\n`);

    const esbuildBin = path.join(root, "node_modules/.bin/esbuild");
    const results = {};
    for (const [label, entry] of [["component-only", componentOnlyEntry], ["component-and-record", componentAndRecordEntry]]) {
      const outFile = path.join(tmp, `${label}.out.mjs`);
      execFileSync(esbuildBin, [entry, "--bundle", "--format=esm", `--outfile=${outFile}`, "--external:react", "--external:react/jsx-runtime"], {
        cwd: tmp,
        stdio: "pipe",
      });
      const buf = readFileSync(outFile);
      results[label] = { rawBytes: buf.length, gzipBytes: gzipSync(buf).length, text: buf.toString("utf8") };
    }

    ok(
      `consumer probe (food, from the packed tarball): component-only=${results["component-only"].rawBytes}B raw/${results["component-only"].gzipBytes}B gzip, component+record=${results["component-and-record"].rawBytes}B raw/${results["component-and-record"].gzipBytes}B gzip (pack-vs-icon granularity evidence — see the PR).`
    );

    const exclusive = exclusiveNamesByPack();
    for (const otherPack of ["animal", "basic", "shapes"]) {
      for (const foreignName of exclusive[otherPack]) {
        if (results["component-only"].text.includes(JSON.stringify(foreignName))) {
          fail(`the component-only consumer probe (bobuttons/icons/food) unexpectedly contains "${foreignName}" from pack "${otherPack}".`);
        }
      }
    }
    if (!failed) ok("consumer probe isolation: the real consumer bundle (built from the packed tarball) contains no other pack's icons.");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function runArtifactChecks() {
  checkBundleNeedles();
  checkNoLicenceCommentLost();
  checkRootBundlesHaveNoPackLiteral();
  checkPerBundleBareSpecifiers();
  checkNoCrossPlatformColourLeak();
  buildConsumerProbe();
}

// ---------------------------------------------------------------------------
// --self-test
// ---------------------------------------------------------------------------

function runSelfTest() {
  const aliasMap = buildAliasMap();
  let selfTestFailed = false;

  // Drop-and-record: a name that genuinely does not exist in lucide (at any
  // plausible version) must resolve to null, never throw and never invent a
  // placeholder.
  const bogusName = "bobuttons-self-test-definitely-not-a-real-lucide-icon";
  const bogusResolved = resolveName(bogusName, aliasMap);
  if (bogusResolved === null) {
    console.log(`[check-icon-packs] self-test: an absent name ("${bogusName}") resolves to null (drop-and-record path) — PASS.`);
  } else {
    console.error(`[check-icon-packs] self-test FAIL: expected "${bogusName}" to resolve to null, got ${JSON.stringify(bogusResolved)}.`);
    selfTestFailed = true;
  }

  // Hard-fail path: a synthetic "Feather-derived" name that does not
  // resolve AND is not in featherUnmappable must be flagged as a hard-fail
  // condition (reusing the exact predicate generate-icon-packs.mjs's --write
  // enforces, without actually invoking process.exit via a child process).
  const bogusFeatherName = "bobuttons-self-test-fake-feather-name";
  const unmappableAllowed = new Map((manifest.featherUnmappable || []).map((e) => [e.name, e.reason]));
  const wouldHardFail = resolveName(bogusFeatherName, aliasMap) === null && !unmappableAllowed.has(bogusFeatherName);
  if (wouldHardFail) {
    console.log(`[check-icon-packs] self-test: an unresolvable, unallowlisted Feather name ("${bogusFeatherName}") trips the hard-fail predicate — PASS.`);
  } else {
    console.error(`[check-icon-packs] self-test FAIL: expected "${bogusFeatherName}" to trip the hard-fail predicate.`);
    selfTestFailed = true;
  }

  if (selfTestFailed) {
    failed = true;
  } else {
    console.log("[check-icon-packs] self-test PASS");
  }
}

async function main() {
  if (mode === "self-test") {
    runSelfTest();
  } else if (mode === "artifacts") {
    runArtifactChecks();
  } else {
    await runStaticChecks();
  }
  if (failed) process.exit(1);
  console.log(`[check-icon-packs] PASS (${mode})`);
}

await main();
