#!/usr/bin/env node
// The single build; every later audit and the one `npm pack` reuse dist/.
//
// 1. tsup bundles src/index.ts into dist/index.mjs + dist/index.cjs.
// 2. tsup (native config) bundles src/index.ts into dist/index.native.js,
//    resolving *.native.ts(x) seam siblings via esbuild conditions/resolve
//    extensions. MUST run after step 1 and with clean:false — the web config
//    cleans dist/ first; running native first or cleaning twice would delete
//    index.mjs/index.cjs.
// 3. `tsc --emitDeclarationOnly` emits dist/index.d.ts from the hand-written
//    public types (explicit rootDir in tsconfig.build.json; TS 6 fails TS5011
//    without it). tsconfig.build.json excludes src/**/*.native.ts(x), so no
//    *.native.d.ts is ever emitted into dist/ (B2-AC4: one shared declaration
//    emit referenced by every export condition, including "react-native").
// 4. dist/index.d.ts is copied unchanged to dist/index.d.mts.
// 5. A separate CJS declaration tree is built: every reachable dist/**/*.d.ts
//    is copied to a sibling *.d.cts with relative ".js" specifiers rewritten to
//    ".cjs". Copying index.d.ts byte-for-byte would leave specifiers pointing
//    at ESM-kind .d.ts files, giving node16 CJS consumers TS1479.
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

/** Writes a .d.cts sibling for `entryDts` and every file it reaches via relative specifiers. */
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
run("npx", ["tsup", "--config", "tsup.native.config.ts"]);
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
