#!/usr/bin/env node
// Measures dist/index.mjs raw + gzip size against the committed budget (ESM
// entry only; the CJS build is a near-duplicate and isn't double-counted).
// --write regenerates the README's distsize JSON block from the same
// measurement so the two can't drift.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const distDir = path.join(root, "dist");
const write = process.argv.includes("--write");

if (!existsSync(distDir)) {
  console.log("[check-dist-size] SKIP: dist/ not found — run `npm run build` first.");
  process.exit(0);
}

const entryPath = path.join(distDir, "index.mjs");
const buf = readFileSync(entryPath);
const rawBytes = buf.length;
const gzipBytes = gzipSync(buf).length;

const budget = JSON.parse(readFileSync(path.join(root, "dist-size-budget.json"), "utf8"));

console.log(
  `[check-dist-size] measured raw=${rawBytes}B gzip=${gzipBytes}B (budget raw<=${budget.rawBytes}B gzip<=${budget.gzipBytes}B)`
);

if (write) {
  updateReadmeBlock(rawBytes, gzipBytes);
  console.log("[check-dist-size] README distsize block updated (--write)");
  process.exit(0);
}

if (rawBytes > budget.rawBytes || gzipBytes > budget.gzipBytes) {
  console.error("[check-dist-size] FAIL: dist size exceeds the committed budget.");
  process.exit(1);
}
console.log("[check-dist-size] PASS");

function updateReadmeBlock(raw, gzip) {
  const readmePath = path.join(root, "README.md");
  let readme = readFileSync(readmePath, "utf8");
  const block = JSON.stringify({ rawBytes: raw, gzipBytes: gzip }, null, 2);
  const marker = /<!-- bobuttons:distsize:start -->[\s\S]*?<!-- bobuttons:distsize:end -->/;
  const replacement = `<!-- bobuttons:distsize:start -->\n\`\`\`json\n${block}\n\`\`\`\n<!-- bobuttons:distsize:end -->`;
  readme = marker.test(readme)
    ? readme.replace(marker, replacement)
    : `${readme}\n\n${replacement}\n`;
  writeFileSync(readmePath, readme, "utf8");
}
