#!/usr/bin/env node
// Runs the generator into a temp directory and byte-compares it with the
// committed outputs; re-derives the theme-id set from the source CSS; and
// asserts all themes share an identical 34-key set.
import { readFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import fg from "fast-glob";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
let failed = false;
function fail(msg) {
  console.error(`[check-themes] FAIL: ${msg}`);
  failed = true;
}

// themeNames equals the [data-theme=...] block set + "default"
const css = readFileSync(path.join(root, "src/themes/themes.source.css"), "utf8");
const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
const blockSelectors = [...cleaned.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim());
const themeIds = new Set();
for (const selector of blockSelectors) {
  const match = /^\[data-theme="([a-z-]+)"\]$/.exec(selector);
  if (match) themeIds.add(match[1]);
}
// Read the generated .ts as text; plain Node can't execute it.
const generatedSrc = readFileSync(path.join(root, "src/themes/themes.generated.ts"), "utf8");
const themeNamesMatch = /export const themeNames = \[([^\]]+)\]/.exec(generatedSrc);
const themeNames = themeNamesMatch ? JSON.parse(`[${themeNamesMatch[1]}]`) : [];

const expected = new Set([...themeIds, "default"]);
const actual = new Set(themeNames);
if (expected.size !== actual.size || [...expected].some((n) => !actual.has(n))) {
  fail(
    `themeNames ${JSON.stringify([...actual])} does not equal [data-theme] blocks + "default" ${JSON.stringify([...expected])}`
  );
}

// Generated output matches the committed file byte for byte
const tmp = mkdtempSync(path.join(os.tmpdir(), "bobuttons-themes-"));
try {
  execFileSync("node", [path.join(root, "scripts/generate-themes.mjs"), "--out", tmp], { stdio: "pipe" });
  for (const rel of ["src/themes/themes.generated.ts"]) {
    const committed = readFileSync(path.join(root, rel), "utf8");
    const generated = readFileSync(path.join(tmp, rel), "utf8");
    if (committed !== generated) {
      fail(`${rel} has drifted from the generator output. Run "npm run generate-themes:write".`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// All themes share an identical 34-key set
const generatedText = generatedSrc;
const themeBlockRe = /"([a-z-]+)":\s*\{([^}]*)\}/g;
let keySets = [];
let m2;
while ((m2 = themeBlockRe.exec(generatedText))) {
  const keys = [...m2[2].matchAll(/^\s*(\w+):/gm)].map((x) => x[1]);
  keySets.push({ theme: m2[1], keys });
}
if (keySets.length !== themeNames.length) {
  fail(`expected ${themeNames.length} theme blocks in themes.generated.ts, found ${keySets.length}`);
}
const refKeys = new Set(keySets[0]?.keys ?? []);
if (refKeys.size !== 34) {
  fail(`expected 34 keys per theme, found ${refKeys.size} in theme "${keySets[0]?.theme}"`);
}
for (const { theme, keys } of keySets) {
  const keySet = new Set(keys);
  const missing = [...refKeys].filter((k) => !keySet.has(k));
  const extra = keys.filter((k) => !refKeys.has(k));
  if (missing.length || extra.length) {
    fail(`theme "${theme}" key mismatch — missing: ${missing.join(",")} extra: ${extra.join(",")}`);
  }
}

// Font scales are total maps, enforced by TypeScript at compile time
const configPath = path.join(root, "src/tamagui.config.ts");
if (existsSync(configPath)) {
  const configText = readFileSync(configPath, "utf8");
  const sizeMatch = /size:\s*\{([^}]*)\}/.exec(configText);
  if (sizeMatch) {
    console.log("[check-themes] tamagui.config.ts font scale present.");
  }
} else {
  console.log("[check-themes] SKIP: src/tamagui.config.ts not found yet — font key-parity check deferred.");
}

// B2-AC14: the theme/token/palette pipeline is already platform-neutral
// (no .css import anywhere under src/, confirmed when this check was
// written); this guard keeps that true so a second, native-only token or
// theme path can't appear later without this check catching it.
const cssImports = fg.sync(["**/*.{ts,tsx}"], { cwd: path.join(root, "src") }).filter((rel) => {
  const text = readFileSync(path.join(root, "src", rel), "utf8");
  return /from\s+["'][^"']+\.css["']|import\s+["'][^"']+\.css["']/.test(text);
});
if (cssImports.length > 0) {
  fail(`src/ imports a .css file (a second, native-incompatible token/theme path): ${cssImports.join(", ")}`);
} else {
  console.log("[check-themes] no .css import anywhere under src/ (B2-AC14).");
}

if (failed) process.exit(1);
console.log(`[check-themes] PASS (${themeIds.size} [data-theme] blocks + default = ${actual.size} themes, 34 keys each)`);
