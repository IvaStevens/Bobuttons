#!/usr/bin/env node
// Fails if any declaration file reachable from the public entry imports
// @tamagui/* or react-native. tsc emits such imports as soon as a styled()
// result (or anything inferred from one) is exported, and consumers then fail
// with TS2307.
//
// Walks the whole relative-import graph from the entry files rather than
// scanning only the roots: a transitive leak (index.d.ts -> tamagui.config.d.ts
// -> @tamagui/web) is invisible to a direct-specifier scan.
import fg from "fast-glob";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");

const FORBIDDEN_SPECIFIER = /(?:from\s+|import\(\s*|require\(\s*)["'](@tamagui\/[^"']+|react-native[^"']*)["']/g;
// Relative specifiers are the graph edges; bare specifiers are leaves.
const RELATIVE_SPECIFIER = /(?:from\s+|import\(\s*|require\(\s*)["'](\.[^"']+)["']/g;

const roots = fg.sync(["index.d.ts", "index.d.mts", "index.d.cts"], { cwd: distDir, absolute: true });

if (roots.length === 0) {
  console.log("[check-dts-encapsulation] SKIP: dist/ not found or empty — run `npm run build` first.");
  process.exit(0);
}

function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  // .js/.mjs/.cjs specifiers map to .d.ts/.d.mts/.d.cts.
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
