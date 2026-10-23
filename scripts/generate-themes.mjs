#!/usr/bin/env node
// Generates the themes (34 keys each) and the named palette from
// src/themes/themes.source.css. Output must be byte-stable:
//   1. Values are copied verbatim; only the 8 derived status-surface tokens
//      are generated.
//   2. Derived values are rgba(R,G,B,A): no spaces, alpha to two decimals.
//   3. Key order is :root declaration order, then statuses x (bg, border);
//      theme order is source block order, "default" first.
//   4. DO-NOT-EDIT banner on every output; LF line endings, trailing newline.
//
// Usage:
//   node scripts/generate-themes.mjs --out <dir>   write into <dir> (for diffing)
//   node scripts/generate-themes.mjs --write        write into the committed paths
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const SOURCE_CSS = path.join(root, "src/themes/themes.source.css");

// Source block order, with `:root` promoted to the selectable "default" theme.
export const THEME_ORDER = [
  "default",
  "ocean",
  "terminal",
  "coastal",
  "dusk",
  "velvet",
  "jade",
  "grove",
];

// CSS variable -> semantic token name, in :root declaration order. --radius is
// excluded: it is a config-level token.
export const TOKEN_MAP = [
  ["--bg", "background"],
  ["--surface", "surface"],
  ["--surface-2", "surface2"],
  ["--surface-3", "surface3"],
  ["--frame-bg", "frameBackground"],
  ["--primary", "primary"],
  ["--primary-dim", "primaryDim"],
  ["--primary-glow", "primaryGlow"],
  ["--secondary", "secondary"],
  ["--secondary-dim", "secondaryDim"],
  ["--secondary-glow", "secondaryGlow"],
  ["--accent", "accent"],
  ["--accent-dim", "accentDim"],
  ["--text", "color"],
  ["--text-dim", "textDim"],
  ["--text-faint", "textFaint"],
  ["--border", "borderColor"],
  ["--sentry-color", "sentry"],
  ["--jira-color", "jira"],
  ["--status-new", "statusNew"],
  ["--status-invest", "statusInvestigating"],
  ["--status-done", "statusInvestigated"],
  ["--status-supp", "statusSuppressed"],
  ["--sla-green", "slaGreen"],
  ["--sla-amber", "slaAmber"],
  ["--sla-red", "slaRed"],
];

// Fixed order for the 8 derived tokens.
const STATUS_ORDER = [
  ["statusNew", "--status-new"],
  ["statusInvestigating", "--status-invest"],
  ["statusInvestigated", "--status-done"],
  ["statusSuppressed", "--status-supp"],
];

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

// A theme block is exactly `:root` or `[data-theme="x"]`. Selectors with a
// descendant part (grove's .status-* rules) must not count as theme blocks.
function parseBlocks(css) {
  const clean = stripComments(css);
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    const selector = m[1].trim().replace(/\s+/g, " ");
    const body = m[2];
    const decls = [];
    for (const line of body.split(";")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx === -1) continue;
      const name = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      decls.push([name, value]);
    }
    blocks.push({ selector, decls });
  }
  return blocks;
}

export function parseThemeSource(css) {
  const blocks = parseBlocks(css);
  const rootBlock = blocks.find((b) => b.selector === ":root");
  if (!rootBlock) throw new Error("themes.source.css: no :root block found");

  const themeBlocks = new Map();
  const statusRuleBlocks = [];
  for (const block of blocks) {
    const themeMatch = /^\[data-theme="([a-z-]+)"\]$/.exec(block.selector);
    if (themeMatch) {
      themeBlocks.set(themeMatch[1], block.decls);
      continue;
    }
    const statusMatch = /^\[data-theme="([a-z-]+)"\]\s+\.status-([a-z-]+)$/.exec(block.selector);
    if (statusMatch) {
      statusRuleBlocks.push({ theme: statusMatch[1], status: statusMatch[2], decls: block.decls });
    }
  }
  return { rootDecls: rootBlock.decls, themeBlocks, statusRuleBlocks };
}

// Palette colours are the :root variables with this prefix: `--color-deep-sea` is the
// token `deepSea`. Themes refer to them with `var(--color-deep-sea)`.
const PALETTE_PREFIX = "--color-";

function camelCase(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// The named palette in :root declaration order, as { name, cssVar, value }.
export function buildPalette(rootDecls) {
  const taken = new Set([...TOKEN_MAP.map(([, name]) => name), ...STATUS_ORDER.flatMap(([n]) => [`${n}Bg`, `${n}Border`])]);
  const palette = [];
  for (const [cssVar, value] of rootDecls) {
    if (!cssVar.startsWith(PALETTE_PREFIX)) continue;
    const name = camelCase(cssVar.slice(PALETTE_PREFIX.length));
    if (!/^#[0-9a-f]{6}$/.test(value)) {
      throw new Error(`palette colour ${cssVar}: expected a lowercase #rrggbb value, got "${value}"`);
    }
    if (taken.has(name)) throw new Error(`palette colour ${cssVar}: "${name}" is already a token name`);
    taken.add(name);
    palette.push({ name, cssVar, value });
  }
  return palette;
}

// Follows `var(--x)` references through `vars` until a plain value is reached.
function resolveValue(value, vars, trail = []) {
  const ref = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  if (!ref) return value;
  const target = ref[1];
  if (trail.includes(target)) throw new Error(`themes.source.css: circular reference through ${target}`);
  const next = vars.get(target);
  if (next === undefined) throw new Error(`themes.source.css: ${target} is not defined`);
  return resolveValue(next, vars, [...trail, target]);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

export function buildThemes() {
  const css = readFileSync(SOURCE_CSS, "utf8");
  const parsed = parseThemeSource(css);
  const rootMap = new Map(parsed.rootDecls);

  const themes = {};
  for (const name of THEME_ORDER) {
    const themeDecls = name === "default" ? [] : parsed.themeBlocks.get(name);
    if (name !== "default" && !themeDecls) {
      throw new Error(`themes.source.css: no block for theme "${name}"`);
    }
    // Flatten: :root values first, then the theme's own declarations.
    const resolved = new Map(rootMap);
    for (const [k, v] of themeDecls || []) resolved.set(k, v);

    const tokens = {};
    for (const [cssVar, semanticName] of TOKEN_MAP) {
      const value = resolved.get(cssVar);
      if (value === undefined) {
        throw new Error(`theme "${name}": missing resolved value for ${cssVar}`);
      }
      tokens[semanticName] = resolveValue(value, resolved);
    }

    const isGrove = name === "grove";
    for (const [semanticName, cssVar] of STATUS_ORDER) {
      const hex = resolveValue(resolved.get(cssVar), resolved);
      const bgAlpha = semanticName === "statusSuppressed" ? 0.08 : isGrove ? 0.08 : 0.12;
      const borderAlpha = semanticName === "statusSuppressed" ? 0.3 : isGrove ? 0.3 : 0.4;
      tokens[`${semanticName}Bg`] = rgba(hex, bgAlpha);
      tokens[`${semanticName}Border`] = rgba(hex, borderAlpha);
    }

    themes[name] = tokens;
  }
  return themes;
}

export function loadPalette() {
  return buildPalette(parseThemeSource(readFileSync(SOURCE_CSS, "utf8")).rootDecls);
}

function allKeys() {
  return [...TOKEN_MAP.map(([, name]) => name), ...STATUS_ORDER.flatMap(([n]) => [`${n}Bg`, `${n}Border`])];
}

function renderThemesTs(themes, palette) {
  const keys = allKeys();
  const banner = "// GENERATED BY scripts/generate-themes.mjs — DO NOT EDIT\n";
  const themeNamesLine = `export const themeNames = [${THEME_ORDER.map((n) => `"${n}"`).join(", ")}] as const;\n`;
  const typeLine = "export type BobuttonsThemeName = (typeof themeNames)[number];\n\n";
  // The index signature is required: `createTamagui({ themes })` needs each
  // theme assignable to `{ [key: string]: string | ... }`. Key parity is
  // therefore checked at runtime by scripts/check-themes.mjs.
  const interfaceLines =
    "export interface BobuttonsThemeTokens {\n" +
    keys.map((k) => `  readonly ${k}: string;`).join("\n") +
    "\n  readonly [key: string]: string;\n" +
    "}\n\n";

  const themeEntries = THEME_ORDER.map((name) => {
    const tokens = themes[name];
    const lines = keys.map((k) => `    ${k}: ${JSON.stringify(tokens[k])},`).join("\n");
    return `  "${name}": {\n${lines}\n  },`;
  }).join("\n");

  const recordLines =
    "export const themes: Record<BobuttonsThemeName, BobuttonsThemeTokens> = {\n" +
    themeEntries +
    "\n};\n";

  const paletteLines =
    "\n// The named palette: every colour the themes use, defined once. Theme-independent.\n" +
    "export const palette = {\n" +
    palette.map(({ name, value }) => `  ${name}: ${JSON.stringify(value)},`).join("\n") +
    "\n} as const;\n\n" +
    "export type BobuttonsPaletteName = keyof typeof palette;\n";

  return banner + "\n" + themeNamesLine + typeLine + interfaceLines + recordLines + paletteLines;
}

function writeFile(dir, relPath, content) {
  const full = path.join(dir, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  const normalised = content.replace(/\r\n/g, "\n");
  writeFileSync(full, normalised.endsWith("\n") ? normalised : normalised + "\n", "utf8");
}

function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const outIdx = args.indexOf("--out");
  const outDir = writeMode ? root : outIdx !== -1 ? args[outIdx + 1] : null;
  if (!outDir) {
    console.error("usage: generate-themes.mjs --write | --out <dir>");
    process.exit(2);
  }

  const themes = buildThemes();
  const palette = loadPalette();
  writeFile(outDir, "src/themes/themes.generated.ts", renderThemesTs(themes, palette));
  console.log(`[generate-themes] wrote themes.generated.ts into ${outDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
