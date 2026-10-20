#!/usr/bin/env node
// The single build (docs/context §N9, step 8 of verify): produces dist/ once,
// reused by every later audit and by the one `npm pack`.
//
// 1. tsup bundles src/index.ts into dist/index.mjs + dist/index.cjs (@tamagui/*
//    bundled in, react/react-dom left external).
// 2. `tsc --emitDeclarationOnly` (tsconfig.build.json, explicit rootDir — TS 6
//    fails TS5011 without it) emits dist/index.d.ts from the hand-written public
//    types (docs/context §C1/§F1 — no styled() result is ever exported, so the
//    emitted declaration never references @tamagui/*).
// 3. dist/index.d.ts is copied to dist/index.d.mts unchanged (a sibling .d.ts
//    is correctly inferred as ESM by the package's "type": "module", which
//    matches a .mts importer, so no rewrite is needed there).
// 4. dist/index.d.cts, and every declaration file it transitively imports via
//    a relative specifier, gets a SEPARATE, internally-consistent CJS
//    declaration tree: each reachable dist/**/*.d.ts is copied to a sibling
//    *.d.cts with every relative import/export specifier's ".js" extension
//    rewritten to ".cjs" (so it resolves to the sibling .d.cts, not the
//    ESM-kind .d.ts).
//
//    Review finding (high): an earlier version of this script copied
//    dist/index.d.ts to dist/index.d.cts BYTE-FOR-BYTE, leaving its relative
//    specifiers (e.g. "./provider/BobuttonsProvider.js") pointing at
//    ESM-kind sibling .d.ts files with no .d.cts companion. A node16 CJS
//    consumer with default skipLibCheck got TS1479 ("whose imports will
//    produce 'require' calls; however, the referenced file is an ECMAScript
//    module") on every such import, plus TS1541 on a re-export — reproduced
//    against the packed tarball from outside this repo. This is the exact
//    pitfall the TaskSpec's verified-pitfall list names: "declaring a
//    require condition without emitting the .cjs fails CJS consumers with
//    TS1479 under node16".
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");

function run(cmd, args) {
  console.log(`[build] ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd: root, stdio: "inherit" });
}

const RELATIVE_SPECIFIER = /(from\s+|import\(\s*|export\s*\*?\s*(?:as\s+\w+\s+)?from\s+)(["'])(\.[^"']+?)(["'])/g;

function cjsDtsPath(dtsPath) {
  return dtsPath.replace(/\.d\.ts$/, ".d.cts");
}

/**
 * BFS over dist/**\/*.d.ts starting at `entryDts`, following relative
 * specifiers only. For every reached file, writes a sibling .d.cts with
 * every relative specifier's trailing ".js" rewritten to ".cjs" (bare
 * specifiers, e.g. "react", are left untouched — those resolve via the
 * dependency's own package.json, unrelated to this package's module kind).
 */
function buildCjsDeclarationTree(entryDts) {
  const visited = new Set();
  const queue = [entryDts];

  while (queue.length > 0) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    visited.add(file);
    if (!existsSync(file)) {
      console.error(`[build] expected declaration file to exist: ${path.relative(root, file)}`);
      process.exit(1);
    }

    const original = readFileSync(file, "utf8");
    const rewritten = original.replace(RELATIVE_SPECIFIER, (match, keyword, q1, specifier, q2) => {
      const resolved = path.resolve(path.dirname(file), specifier.replace(/\.js$/, ".d.ts"));
      if (existsSync(resolved) && !visited.has(resolved)) queue.push(resolved);
      const cjsSpecifier = specifier.replace(/\.js$/, ".cjs");
      return `${keyword}${q1}${cjsSpecifier}${q2}`;
    });

    writeFileSync(cjsDtsPath(file), rewritten);
  }

  return visited.size;
}

run("npx", ["tsup", "--config", "tsup.config.ts"]);
run("npx", ["tsc", "-p", "tsconfig.build.json"]);

const dts = path.join(distDir, "index.d.ts");
if (!existsSync(dts)) {
  console.error("[build] expected dist/index.d.ts to exist after tsc build");
  process.exit(1);
}
copyFileSync(dts, path.join(distDir, "index.d.mts"));

const cjsFileCount = buildCjsDeclarationTree(dts);
console.log(`[build] wrote a self-consistent CJS declaration tree (${cjsFileCount} file(s), rooted at dist/index.d.cts)`);

console.log("[build] done");
