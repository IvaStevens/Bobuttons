#!/usr/bin/env node
// Finding F1 (named by no AC, but load-bearing for AC15): fails if any
// declaration file reachable from the package's public entry imports from
// @tamagui/* or react-native. Plain tsc emits `import { ... } from
// '@tamagui/core'` into a .d.ts the moment a styled() result (or anything
// inferred from one) is exported; the AC15 scratch consumer then fails
// TS2307 under both resolutions.
//
// Review finding (high): an earlier version of this script scanned only
// index.d.{ts,mts,cts} for a DIRECT "@tamagui/..." specifier. That missed a
// transitive leak: index.d.ts re-exported a type "from './tamagui.config.js'"
// — a relative specifier the direct-specifier regex never matches — and
// dist/tamagui.config.d.ts itself references "@tamagui/web" on ~50 lines.
// Loading index.d.ts therefore forced TypeScript to open
// tamagui.config.d.ts, which failed to resolve outside this repo.
//
// Fixed approach: walk the ACTUAL declaration import graph starting from the
// public entry files (the ones reachable via package.json "exports" ->
// "types"), following every relative import/export specifier recursively,
// and scan every file reached — not just the roots — for an @tamagui/* or
// react-native specifier.
import fg from "fast-glob";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");

const FORBIDDEN_SPECIFIER = /(?:from\s+|import\(\s*|require\(\s*)["'](@tamagui\/[^"']+|react-native[^"']*)["']/g;
// Relative specifiers only — these are the edges we traverse. Bare
// specifiers (anything not starting with "." or "/") are leaf nodes: either
// forbidden (caught by FORBIDDEN_SPECIFIER above) or an allowed external
// (e.g. "react"), never something we need to open and recurse into.
const RELATIVE_SPECIFIER = /(?:from\s+|import\(\s*|require\(\s*)["'](\.[^"']+)["']/g;

const roots = fg.sync(["index.d.ts", "index.d.mts", "index.d.cts"], { cwd: distDir, absolute: true });

if (roots.length === 0) {
  console.log("[check-dts-encapsulation] SKIP: dist/ not found or empty — run `npm run build` first.");
  process.exit(0);
}

function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  // specifier typically ends in .js / .mjs / .cjs (ESM/CJS import style);
  // the sibling declaration file swaps that for .d.ts / .d.mts / .d.cts.
  const candidates = [
    base.replace(/\.mjs$/, ".d.mts").replace(/\.cjs$/, ".d.cts").replace(/\.js$/, ".d.ts"),
    `${base}.d.ts`,
    path.join(base, "index.d.ts"),
  ];
  return candidates.find((c) => existsSync(c)) ?? null;
}

const visited = new Set();
const queue = [...roots];
let failed = false;

while (queue.length > 0) {
  const file = queue.shift();
  if (visited.has(file)) continue;
  visited.add(file);

  const text = readFileSync(file, "utf8");

  let match;
  FORBIDDEN_SPECIFIER.lastIndex = 0;
  while ((match = FORBIDDEN_SPECIFIER.exec(text))) {
    console.error(
      `[check-dts-encapsulation] FAIL: ${path.relative(root, file)} references "${match[1]}" — a public type leaked a Tamagui/react-native symbol.`
    );
    failed = true;
  }

  RELATIVE_SPECIFIER.lastIndex = 0;
  while ((match = RELATIVE_SPECIFIER.exec(text))) {
    const resolved = resolveRelative(file, match[1]);
    if (resolved && !visited.has(resolved)) queue.push(resolved);
  }
}

if (failed) process.exit(1);
console.log(
  `[check-dts-encapsulation] PASS (walked ${visited.size} declaration file(s) reachable from ${roots.length} public entry point(s))`
);
