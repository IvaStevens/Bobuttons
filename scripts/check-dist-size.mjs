#!/usr/bin/env node
// Measures every shipped bundle against the committed per-bundle budget. The
// bundle list is no longer hardcoded (B2-AC22 named exactly three; BOBUTTONS-4
// widened this gate, as its own AC requires, to all `dist-size-budget.json`
// keys, plus a REVERSE check that every emitted dist/**/*.{mjs,cjs,js} file
// has a budget entry — a missing pack bundle file OR a missing budget entry
// now fails the gate either way). A `pinned: true` bundle's limit may not be
// raised by --write (refuses, rather than silently absorbing growth into a
// re-baseline while B2-AC11 is claimed); a raise on a pinned bundle needs a
// manual, reasoned edit to dist-size-budget.json, called out in the PR per
// B2-AC22. --write regenerates the README's distsize JSON block from the
// same measurement so the two can't drift.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fg from "fast-glob";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");
const write = process.argv.includes("--write");

if (!existsSync(distDir)) {
  console.log("[check-dist-size] SKIP: dist/ not found — run `npm run build` first.");
  process.exit(0);
}

const budgetPath = path.join(root, "dist-size-budget.json");
const budget = JSON.parse(readFileSync(budgetPath, "utf8"));

const BUNDLES = Object.keys(budget.bundles);

let failed = false;
let writeRefused = false;
const measurements = {};

for (const name of BUNDLES) {
  const entryPath = path.join(distDir, name);
  if (!existsSync(entryPath)) {
    console.error(`[check-dist-size] FAIL: expected dist/${name} to exist.`);
    failed = true;
    continue;
  }
  const buf = readFileSync(entryPath);
  const rawBytes = buf.length;
  const gzipBytes = gzipSync(buf).length;
  measurements[name] = { rawBytes, gzipBytes };

  const limit = budget.bundles[name];
  if (!limit) {
    console.error(`[check-dist-size] FAIL: dist-size-budget.json has no entry for "${name}".`);
    failed = true;
    continue;
  }

  console.log(
    `[check-dist-size] ${name}: measured raw=${rawBytes}B gzip=${gzipBytes}B (budget raw<=${limit.rawBytes}B gzip<=${limit.gzipBytes}B${limit.pinned ? ", pinned" : ""})`
  );

  if (!write && (rawBytes > limit.rawBytes || gzipBytes > limit.gzipBytes)) {
    console.error(`[check-dist-size] FAIL: ${name} exceeds the committed budget.`);
    failed = true;
  }

  if (write && limit.pinned && (rawBytes > limit.rawBytes || gzipBytes > limit.gzipBytes)) {
    console.error(
      `[check-dist-size] FAIL: --write refuses to raise the PINNED budget for ${name} (measured raw=${rawBytes}/gzip=${gzipBytes} exceeds raw=${limit.rawBytes}/gzip=${limit.gzipBytes}). Edit dist-size-budget.json by hand and call the raise out in the PR (B2-AC22).`
    );
    writeRefused = true;
  }
}

// Reverse direction: every emitted top-level JS bundle must have a budget
// entry, keyed by its dist-relative path. Declaration files (.d.ts/.d.mts/
// .d.cts) and anything under dist/icons/glyphs/** (not a bundle, an internal
// data module with no budget of its own) are not bundles and are excluded.
const emitted = fg.sync(["**/*.{mjs,cjs,js}"], { cwd: distDir });
const budgeted = new Set(BUNDLES);
const unbudgeted = emitted.filter((rel) => !budgeted.has(rel));
if (unbudgeted.length > 0) {
  console.error(`[check-dist-size] FAIL: emitted bundle(s) with no dist-size-budget.json entry: ${unbudgeted.join(", ")}`);
  failed = true;
} else {
  console.log(`[check-dist-size] every emitted dist/**/*.{mjs,cjs,js} file (${emitted.length}) has a budget entry.`);
}

if (write) {
  // `failed` covers a missing bundle file or a missing budget entry — if
  // either happened, `measurements` is partial, so regenerating the README
  // block from it would silently drop a bundle from the documented sizes
  // (review finding: this used to only check `writeRefused`). Refuse in
  // both cases rather than writing a partial block.
  if (writeRefused || failed) process.exit(1);
  updateReadmeBlock(measurements);
  console.log("[check-dist-size] README distsize block updated (--write)");
  process.exit(0);
}

if (failed) process.exit(1);
console.log("[check-dist-size] PASS");

function updateReadmeBlock(byBundle) {
  const readmePath = path.join(root, "README.md");
  let readme = readFileSync(readmePath, "utf8");
  const block = JSON.stringify(byBundle, null, 2);
  const marker = /<!-- bobuttons:distsize:start -->[\s\S]*?<!-- bobuttons:distsize:end -->/;
  const replacement = `<!-- bobuttons:distsize:start -->\n\`\`\`json\n${block}\n\`\`\`\n<!-- bobuttons:distsize:end -->`;
  readme = marker.test(readme)
    ? readme.replace(marker, replacement)
    : `${readme}\n\n${replacement}\n`;
  writeFileSync(readmePath, readme, "utf8");
}
