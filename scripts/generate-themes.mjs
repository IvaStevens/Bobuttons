#!/usr/bin/env node
// Generates the nine themes (34 keys each) and the token-mapping doc from the
// vendored src/themes/themes.source.css. Output must be byte-stable:
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
      tokens[semanticName] = value;
    }

    const isGrove = name === "grove";
    for (const [semanticName, cssVar] of STATUS_ORDER) {
      const hex = resolved.get(cssVar);
      const bgAlpha = semanticName === "statusSuppressed" ? 0.08 : isGrove ? 0.08 : 0.12;
      const borderAlpha = semanticName === "statusSuppressed" ? 0.3 : isGrove ? 0.3 : 0.4;
      tokens[`${semanticName}Bg`] = rgba(hex, bgAlpha);
      tokens[`${semanticName}Border`] = rgba(hex, borderAlpha);
    }

    themes[name] = tokens;
  }
  return themes;
}

function allKeys() {
  return [...TOKEN_MAP.map(([, name]) => name), ...STATUS_ORDER.flatMap(([n]) => [`${n}Bg`, `${n}Border`])];
}

function renderThemesTs(themes) {
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

  return banner + "\n" + themeNamesLine + typeLine + interfaceLines + recordLines;
}

function renderTokenMappingDoc() {
  const keys = allKeys();
  const banner = "<!-- GENERATED BY scripts/generate-themes.mjs — DO NOT EDIT -->\n\n";
  const title = "# Token mapping\n\n";
  const intro =
    "CSS variable (from `themes.css`) -> Bobuttons semantic token name. `--primary` -> `primary`, " +
    "`--secondary` -> `secondary` and `--accent` -> `accent` are fixed by AC5; the remaining names are fixed " +
    "here. `--radius` is excluded: it is a config-level token (AC7), seeded once in `src/tamagui.config.ts` " +
    "and not overridden by any theme.\n\n" +
    "## Colour tokens (26, carried over from `:root`)\n\n" +
    "| CSS variable | token |\n|---|---|\n" +
    TOKEN_MAP.map(([cssVar, name]) => `| \`${cssVar}\` | \`${name}\` |`).join("\n") +
    "\n\n" +
    "## Derived status-surface tokens (8)\n\n" +
    "For each status, a background and a border token computed from that theme's own status colour at " +
    "alpha 0.12 background / 0.40 border (suppressed: 0.08 / 0.30), except `grove`, which uses 0.08 / 0.30 " +
    "for all four (AC6). These replace the class-selector rules at `queue.css:208-211` and " +
    "`themes.css:216-219`.\n\n" +
    "| token | derived from |\n|---|---|\n" +
    STATUS_ORDER.flatMap(([name, cssVar]) => [
      `| \`${name}Bg\` | \`${cssVar}\` |`,
      `| \`${name}Border\` | \`${cssVar}\` |`,
    ]).join("\n") +
    "\n\n" +
    `Total: ${TOKEN_MAP.length} colour tokens + ${STATUS_ORDER.length * 2} derived = ${keys.length} keys per theme, ` +
    `${THEME_ORDER.length} themes.\n\n` +
    "## Reconciliation direction (AC8)\n\n" +
    "`oncall-navigator-app/src/styles/themes.css` is the single source of truth. " +
    "`DailyTracker/src/styles/global.css` declares only `:root` (18 vars, no status/sla/sentry/jira tokens) " +
    "and `ocean`/`terminal`/`coastal` with values byte-identical to `themes.css`; it contributes no theme " +
    "and no token. Should the two ever diverge, `themes.css` wins.\n\n" +
    "## Non-colour scales (AC7)\n\n" +
    "Font size steps: 8, 9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 36 (px; " +
    "measured across both source apps — see docs/context §F2). Line heights are a documented derivation, " +
    "not a transcription (the source CSS declares none for most sizes): `round(size * 1.4)` for the body " +
    "family, `round(size * 1.45)` for mono.\n\n" +
    "### Font weight\n\n" +
    "Measured weight set across both source apps: 300, 400, 450, 500, 600, 700, 800 (docs/context §A5). " +
    "A per-font-size weight map (Tamagui's `font.weight`, keyed identically to `font.size`) was considered " +
    "and rejected: there is no functional correlation between size and weight in the source CSS — 11px " +
    "alone appears at weight 500 (`shell.css:52`), 600 (`detail.css:221`) and 700 (`detail.css:33`) in " +
    "different selectors, so a size->weight function would invent a correlation the source data does not " +
    "have. Every per-size-step weight entry in `src/tamagui.config.ts` therefore stays the CSS default, " +
    "400. The measured set is instead exposed as named constants — `fontWeights` " +
    "(`src/tokens/fontWeights.ts`, re-exported from both `src/tamagui.config.ts` and the public entry) — " +
    "which components import and pass directly, e.g. `fontWeight={fontWeights.bold}`. That keeps every one " +
    "of the seven weight numbers defined exactly once, in a config-adjacent file, rather than as a raw " +
    "numeric literal in component source (AC7).\n";
  return banner + title + intro;
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
  writeFile(outDir, "src/themes/themes.generated.ts", renderThemesTs(themes));
  writeFile(outDir, "docs/api/token-mapping.md", renderTokenMappingDoc());
  console.log(`[generate-themes] wrote themes.generated.ts and token-mapping.md into ${outDir}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
