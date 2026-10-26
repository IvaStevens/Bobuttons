#!/usr/bin/env node
// The environment-independent half of the native gate (B2-AC2's "renders on
// Android" and B2-AC16's device-level checks are done BY HAND in a scratch
// app outside this repo, per the kickoff decision — see README). Everything
// here needs no Android SDK, JDK, emulator or device:
//
//   1. the native bundle (dist/index.native.js) imports ONLY react,
//      react/jsx-runtime and react-native (B2-AC7/B2-AC8/B2-AC9);
//   2. no react-dom or react-native-web module marker anywhere in a real
//      Metro dependency graph built from the PACKED TARBALL (B2-AC8) —
//      Metro.runBuild(platform="android") needs no Android SDK/JDK/emulator,
//      only this repo's own node_modules (react-native, metro,
//      @react-native/metro-config) plus a minimal entry file written into a
//      temp dir at runtime and cleaned up (no committed harness/overlay);
//   3. the B2-AC12 token scan of dist/index.native.js, scoped to Bobuttons'
//      OWN bundled modules (see SCAN NOTE below);
//   4. the native consumer typecheck pair (moduleResolution bundler/node16,
//      customConditions:["react-native"]) over the packed tarball, proving
//      B2-AC4's "one shared declaration emit referenced by every export
//      condition" on the shipped artifact, the same way check-scratch-install
//      already proves it for the web conditions.
//
// SCAN NOTE (B2-AC12 "scan as specified is unsatisfiable", measured):
// esbuild preserves a `// <path>` banner comment before each bundled module
// when not minified. Scanning the WHOLE bundle for var(--/document./etc.
// gives false positives from @tamagui/core's own native-targeted source
// (e.g. @tamagui/web's createVariable.native.js still contains the string
// `var(--...)` in an `isWeb`-guarded branch that is dead code on native, but
// is never removed from the shipped file) — those are not ours to fix and
// are not reachable at runtime. This scan therefore only checks segments
// whose banner path starts with "src/" (Bobuttons' own source) against the
// B2-AC12 token list, and separately asserts the whole-bundle import graph
// (via module specifiers, not substrings) excludes react-dom/react-native-web.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const selfTest = process.argv.includes("--self-test");

let failed = false;
function fail(msg) {
  console.error(`[check-native-bundle] FAIL: ${msg}`);
  failed = true;
}
function ok(msg) {
  console.log(`[check-native-bundle] ${msg}`);
}

const nativeBundlePath = path.join(root, "dist/index.native.js");
if (!existsSync(nativeBundlePath)) {
  console.log("[check-native-bundle] SKIP: dist/index.native.js not found — run `npm run build` first.");
  process.exit(0);
}
const packMetaPath = path.join(root, ".verify-out/pack.json");
if (!existsSync(packMetaPath)) {
  console.log("[check-native-bundle] SKIP: .verify-out/pack.json not found — run `npm run pack` first.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 1. The shipped artifact's own bare specifiers.
// ---------------------------------------------------------------------------
function checkBundleSpecifiers() {
  const src = readFileSync(nativeBundlePath, "utf8");
  const specs = new Set();
  const SPECIFIER = /(?:from\s+|require\(\s*|import\(\s*)["']([^"'.][^"']*)["']/g;
  let m;
  while ((m = SPECIFIER.exec(src))) specs.add(m[1]);
  // The one deep import is react-native's internal usePressability, which
  // @tamagui/web calls and react-native's public index does not export (see
  // scripts/esbuild-native-resolve.ts). It is allow-listed by exact path, so
  // any OTHER react-native/... deep import still fails this gate.
  const allowed = new Set([
    "react",
    "react/jsx-runtime",
    "react-native",
    "react-native/Libraries/Pressability/usePressability",
  ]);
  const extra = [...specs].filter((s) => !allowed.has(s));
  if (extra.length > 0) {
    fail(`dist/index.native.js imports unexpected bare specifiers: ${extra.join(", ")} (expected only ${[...allowed].join(", ")}).`);
  } else {
    ok(`dist/index.native.js imports only ${[...specs].sort().join(", ")} (scanned ${src.length}B).`);
  }
  // esbuild's `__require("x")` shim is what a bare, non-static require() in a
  // bundled dependency turns into. Metro cannot resolve it at build time, so it
  // throws `Unknown named module` on a device even though the bundle builds and
  // the specifier above looks allowed. A static `import` never produces it.
  const dynamicRequires = [...src.matchAll(/\b__require\(\s*["']([^"']+)["']/g)].map((d) => d[1]);
  if (dynamicRequires.length > 0) {
    fail(`dist/index.native.js contains non-static require() calls Metro cannot resolve: ${[...new Set(dynamicRequires)].join(", ")}.`);
  } else {
    ok("dist/index.native.js has no non-static __require(\"...\") calls.");
  }
  if (/\breact-dom\b/.test(src) === false && /react-native-web/.test(src) === false) {
    ok("no react-dom/react-native-web text occurrence in dist/index.native.js.");
  } else {
    // Not an immediate fail: RN's own bundled strings can contain these
    // substrings (e.g. a WebView invariant message). The structural check
    // in checkMetroGraph() is the real B2-AC8 assertion; this is a cheap
    // early signal only.
    console.log("[check-native-bundle] note: text occurrence of react-dom/react-native-web found in dist/index.native.js — not a failure by itself (see checkMetroGraph's structural check).");
  }
}

// ---------------------------------------------------------------------------
// 2. The B2-AC12 token scan, scoped to src/-owned bundled modules.
// ---------------------------------------------------------------------------
function checkTokenScan() {
  const src = readFileSync(nativeBundlePath, "utf8");
  const lines = src.split("\n");
  const BANNER = /^\/\/ (node_modules\/\S+|src\/\S+)$/;
  const PATTERNS = {
    "var(--": /var\(--/,
    "linear-gradient(": /linear-gradient\(/,
    "color-mix(": /color-mix\(/,
    "oklch(": /oklch\(/,
    "::placeholder": /::placeholder/,
    "::-webkit-": /::-webkit-/,
    "data-bobuttons": /data-bobuttons/,
    "document.": /\bdocument\./,
    "100vh": /100vh/,
    "inline-flex": /inline-flex/,
    "not-allowed": /not-allowed/,
    "currentColor": /currentColor/,
  };
  const hits = Object.fromEntries(Object.keys(PATTERNS).map((k) => [k, []]));
  let currentModule = "(preamble)";
  let ownedLines = 0;
  for (const line of lines) {
    const bannerMatch = BANNER.exec(line);
    if (bannerMatch) {
      currentModule = bannerMatch[1];
      continue;
    }
    if (!currentModule.startsWith("src/")) continue;
    ownedLines++;
    for (const [name, re] of Object.entries(PATTERNS)) {
      if (re.test(line)) hits[name].push(currentModule);
    }
  }
  if (ownedLines === 0) {
    fail("token scan found zero lines attributed to a src/ module — the banner-comment heuristic found nothing to scan (bundle format may have changed).");
    return;
  }
  let anyHit = false;
  for (const [name, modules] of Object.entries(hits)) {
    if (modules.length > 0) {
      anyHit = true;
      fail(`token "${name}" found in Bobuttons' own bundled source: ${[...new Set(modules)].join(", ")}`);
    }
  }
  if (!anyHit) {
    ok(`token scan clean across ${ownedLines} lines of Bobuttons' own bundled source (0/${Object.keys(PATTERNS).length} tokens).`);
  }
}

// ---------------------------------------------------------------------------
// 3. Metro build over the packed tarball, from a runtime-only temp entry.
// ---------------------------------------------------------------------------
async function checkMetroGraph() {
  const packMeta = JSON.parse(readFileSync(packMetaPath, "utf8"))[0];
  const tarballPath = path.join(root, ".verify-out", packMeta.filename.replace("@", "").replace("/", "-"));
  if (!existsSync(tarballPath)) {
    fail(`expected tarball at ${tarballPath}`);
    return;
  }

  // Inside the repo (not os.tmpdir()): Metro's and Node's own module
  // resolution walk UP the file's ancestor directories to find
  // node_modules, so the temp project must be a descendant of this repo to
  // resolve react/react-native/etc. from the repo's own install — the whole
  // point of running Metro "from the repo's node_modules" (see tsup.native
  // .config.ts's sibling comment) rather than installing a second tree.
  mkdirSync(path.join(root, ".verify-out"), { recursive: true });
  const tmp = mkdtempSync(path.join(root, ".verify-out", "native-bundle-"));
  try {
    execFileSync("tar", ["-xf", tarballPath, "-C", tmp]);
    const nodeModules = path.join(tmp, "node_modules");
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(path.join(tmp, "package"), path.join(nodeModules, "bobuttons"), "dir");
    writeFileSync(path.join(tmp, "package.json"), JSON.stringify({ name: "bobuttons-native-bundle-check", version: "0.0.0" }, null, 2));
    writeFileSync(path.join(tmp, "entry.js"), 'import { BobuttonsProvider, Button } from "bobuttons";\nexport { BobuttonsProvider, Button };\n');

    const { getDefaultConfig, mergeConfig } = await import(path.join(root, "node_modules/@react-native/metro-config/dist/index.js"));
    const Metro = await import(path.join(root, "node_modules/metro/src/index.flow.js"));

    const defaultConfig = getDefaultConfig(tmp);
    const config = mergeConfig(defaultConfig, {
      projectRoot: tmp,
      watchFolders: [tmp, root],
    });

    const bundleOut = path.join(tmp, "out.bundle.js");
    await Metro.runBuild(config, {
      entry: path.join(tmp, "entry.js"),
      platform: "android",
      dev: true,
      minify: false,
      out: bundleOut,
    });

    const code = readFileSync(bundleOut, "utf8");
    const mjsHits = (code.match(/dist\/index\.mjs/g) || []).length;
    const cjsHits = (code.match(/dist\/index\.cjs/g) || []).length;
    const nativeHits = (code.match(/dist\/index\.native\.js/g) || []).length;
    const reactDomHits = (code.match(/node_modules\/react-dom\//g) || []).length;
    const rnWebHits = (code.match(/node_modules\/react-native-web\//g) || []).length;
    // NOTE (review finding, corrected wording): dist/index.native.js is
    // itself a pre-bundled artifact (tsup/esbuild already inlined
    // @tamagui/core at BUILD time), so Metro's dependency graph never
    // resolves a separate @tamagui/core module at all — bobuttons is one
    // opaque module to Metro. This count is therefore NOT "modules in
    // Metro's graph"; it is the number of esbuild-preserved `// <path>`
    // banner comments naming Tamagui's native runtime entry point INSIDE
    // that one pre-bundled file, as it appears verbatim in Metro's output.
    // It is a build-time duplication check (did tsup inline Tamagui's
    // native runtime more than once?), still safe (fails loudly on a
    // count change) but measuring a different thing than "modules in the
    // Metro graph" — see the corrected assertion message below.
    const tamaguiNativeRuntimeHits = (code.match(/@tamagui\/(core|web)\/dist\/esm\/index\.native\.js/g) || []).length;

    if (nativeHits < 1) fail("Metro's dependency graph never reached dist/index.native.js — the react-native export condition did not resolve.");
    else ok(`Metro resolved bobuttons to dist/index.native.js (${nativeHits} module marker(s)).`);

    if (mjsHits > 0 || cjsHits > 0) fail(`Metro's graph also reached a web bundle (index.mjs: ${mjsHits}, index.cjs: ${cjsHits}) — the react-native condition is not winning.`);
    else ok("Metro's graph contains neither dist/index.mjs nor dist/index.cjs.");

    if (reactDomHits > 0 || rnWebHits > 0) fail(`Metro's graph contains a react-dom/react-native-web module (react-dom: ${reactDomHits}, react-native-web: ${rnWebHits}).`);
    else ok("Metro's graph contains no react-dom/react-native-web module.");

    if (tamaguiNativeRuntimeHits !== 1) {
      fail(`expected exactly one @tamagui/core|web native runtime banner-comment inside the pre-bundled dist/index.native.js (a build-time duplication check, not a Metro-graph module count — see the comment above), found ${tamaguiNativeRuntimeHits} (B2-AC9).`);
    } else {
      ok("exactly one @tamagui/core native runtime instance was inlined into dist/index.native.js at build time (B2-AC9; measured via esbuild's preserved banner comment, since Metro never resolves a separate @tamagui/core module for an already-bundled package).");
    }

    console.log(`[check-native-bundle] Metro graph: ${code.length}B total.`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// 4. Native consumer typecheck pair over the packed tarball.
// ---------------------------------------------------------------------------
function checkConsumerTypecheck() {
  const packMeta = JSON.parse(readFileSync(packMetaPath, "utf8"))[0];
  const tarballPath = path.join(root, ".verify-out", packMeta.filename.replace("@", "").replace("/", "-"));
  const tmp = mkdtempSync(path.join(root, ".verify-out", "native-typecheck-"));
  const tscBin = path.join(root, "node_modules/typescript/bin/tsc");
  try {
    execFileSync("tar", ["-xf", tarballPath, "-C", tmp]);
    const nodeModules = path.join(tmp, "node_modules");
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(path.join(tmp, "package"), path.join(nodeModules, "bobuttons"), "dir");
    writeFileSync(path.join(tmp, "consumer.ts"), 'import { Button } from "bobuttons";\nexport { Button };\n');

    for (const [label, moduleResolution, module] of [
      ["bundler", "bundler", "esnext"],
      ["node16", "node16", "node16"],
    ]) {
      const tsconfigPath = path.join(tmp, `tsconfig.${label}.json`);
      writeFileSync(
        tsconfigPath,
        JSON.stringify(
          {
            compilerOptions: {
              moduleResolution,
              module,
              customConditions: ["react-native"],
              target: "es2022",
              strict: false,
              noEmit: true,
              skipLibCheck: true,
            },
            include: ["consumer.ts"],
          },
          null,
          2
        )
      );
      try {
        execFileSync(process.execPath, [tscBin, "--noEmit", "-p", tsconfigPath], { cwd: tmp, stdio: "pipe" });
        ok(`native consumer typecheck (${label}, customConditions:["react-native"]): PASS`);
      } catch (err) {
        fail(`native consumer typecheck (${label}) failed:\n${String(err.stdout || err.message)}`);
      }
    }

    if (selfTest) {
      // MEASURED FINDING, not the plan's original assumption: removing
      // customConditions does NOT make this typecheck fail. Both the
      // "react-native" and "import" export conditions point at
      // type-compatible declarations by design (B2-AC4: one shared
      // declaration emit referenced by every export condition), so a
      // consumer missing the condition still gets correctly-typed results
      // via the web d.ts — there is no TS-level trap to assert a negative
      // control against. The real proof that the "react-native" condition
      // is what makes a BUNDLER pick the native JS (not just its types) is
      // checkMetroGraph()'s structural assertion above, which fails loudly
      // if that condition is missing or misordered. Recorded here instead
      // of building a self-test that would assert something false.
      ok("self-test note: no TS-level negative control applies (see comment) — checkMetroGraph() is the structural proof.");
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

checkBundleSpecifiers();
checkTokenScan();
await checkMetroGraph();
checkConsumerTypecheck();

if (failed) process.exit(1);
console.log("[check-native-bundle] PASS");
