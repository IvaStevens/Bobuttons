#!/usr/bin/env node
// Generates src/icons/glyphs/<pack>.generated.ts from the pinned `lucide`
// devDependency, mirroring generate-themes.mjs's pipeline: hand-authored
// input (scripts/icon-packs.json's `listed` arrays) -> this generator ->
// committed generated modules -> scripts/check-icon-packs.mjs's no-diff gate.
//
// Resolution is mechanical and never substitutes/redraws/placeholders a
// name: every listed kebab-case name is resolved against the INSTALLED
// lucide package, through its alias map (iconsAndAliases.mjs), parsing EVERY
// `default as X` clause on a line — a single-alias regex would silently
// drop a multi-alias name like `triangle-alert` (aliased alongside
// `AlertTriangle`/`TriangleExclamationPoint` on one line) and misreport it
// as upstream-absent. A name that resolves to neither a direct icon file nor
// an alias is DROPPED from its pack and recorded in `absent`, never
// invented. Any lucide element tag/attribute outside the small closed set
// this library's renderer understands (path/circle/rect/ellipse; d / cx,cy,r
// / x,y,width,height,rx,ry / cx,cy,rx,ry) is a hard generator failure, not a
// silent drop — that would be a real upstream shape change needing a code
// change, not a data omission.
//
// Usage:
//   node scripts/generate-icon-packs.mjs --out <dir>   write into <dir> (for diffing)
//   node scripts/generate-icon-packs.mjs --write        write into the committed paths
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const root = path.resolve(fileURLToPath(import.meta.url), "../..");
export const MANIFEST_PATH = path.join(root, "scripts/icon-packs.json");
export const LUCIDE_DIR = path.join(root, "node_modules/lucide");

export const PACK_NAMES = ["animal", "basic", "food", "shapes"];

export const ALLOWED_TAGS = new Set(["path", "circle", "rect", "ellipse"]);
export const ALLOWED_ATTRS = new Set(["d", "cx", "cy", "r", "x", "y", "width", "height", "rx", "ry"]);

export function toPascalCase(kebab) {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

export function lucideVersion() {
  const pkg = JSON.parse(readFileSync(path.join(LUCIDE_DIR, "package.json"), "utf8"));
  return pkg.version;
}

// Parses iconsAndAliases.mjs for every
//   export { default as X, default as Y, ... } from './icons/<slug>.mjs';
// line, capturing EVERY `default as <Name>` clause (not just the first), and
// returns a Map from PascalCase export name -> canonical slug.
export function buildAliasMap() {
  const text = readFileSync(path.join(LUCIDE_DIR, "dist/esm/iconsAndAliases.mjs"), "utf8");
  const map = new Map();
  const lineRe = /export\s*\{([^}]+)\}\s*from\s*['"]\.\/icons\/([a-z0-9-]+)\.mjs['"];/g;
  let lineMatch;
  while ((lineMatch = lineRe.exec(text))) {
    const [, clauseList, slug] = lineMatch;
    const nameRe = /default\s+as\s+(\w+)/g;
    let nameMatch;
    while ((nameMatch = nameRe.exec(clauseList))) {
      map.set(nameMatch[1], slug);
    }
  }
  return map;
}

// Resolves a listed kebab-case name to a canonical lucide slug + how it was
// resolved. Returns null (never throws) when the name is genuinely absent —
// the caller is responsible for dropping it, never substituting.
export function resolveName(kebabName, aliasMap) {
  const directPath = path.join(LUCIDE_DIR, "dist/esm/icons", `${kebabName}.mjs`);
  if (existsSync(directPath)) {
    return { canonicalSlug: kebabName, resolvedVia: "direct-file" };
  }
  const pascalName = toPascalCase(kebabName);
  const slug = aliasMap.get(pascalName);
  if (slug) {
    return { canonicalSlug: slug, resolvedVia: `alias:${pascalName}` };
  }
  return null;
}

export async function loadGlyphShape(canonicalSlug) {
  const filePath = path.join(LUCIDE_DIR, "dist/esm/icons", `${canonicalSlug}.mjs`);
  const mod = await import(pathToFileURL(filePath).href);
  const shape = mod.default;
  if (!Array.isArray(shape)) {
    throw new Error(`lucide icon "${canonicalSlug}" did not export an array default — upstream shape changed.`);
  }
  for (const node of shape) {
    if (!Array.isArray(node) || node.length !== 2) {
      throw new Error(`lucide icon "${canonicalSlug}" has a malformed element (expected [tag, attrs]): ${JSON.stringify(node)}`);
    }
    const [tag, attrs] = node;
    if (!ALLOWED_TAGS.has(tag)) {
      throw new Error(
        `lucide icon "${canonicalSlug}" uses tag "${tag}", which is outside this renderer's closed set (${[...ALLOWED_TAGS].join(", ")}) — upstream shape change, needs a code change, not a data regeneration.`
      );
    }
    for (const key of Object.keys(attrs)) {
      if (!ALLOWED_ATTRS.has(key)) {
        throw new Error(
          `lucide icon "${canonicalSlug}" <${tag}> uses attribute "${key}", which is outside this renderer's closed set (${[...ALLOWED_ATTRS].join(", ")}) — upstream shape change, needs a code change, not a data regeneration.`
        );
      }
    }
  }
  return shape;
}

// Parses the Feather-derived name list out of lucide's own LICENSE, and
// resolves each one through the SAME alias-map resolution used for pack
// names (the reviewer's four "unmappable" counter-examples — trash-2,
// x-circle, x-octagon, x-square — only looked unmappable because a
// kebab-module lookup was tried instead of the alias map; all 115 resolve).
export function parseFeatherNames() {
  const licenseText = readFileSync(path.join(LUCIDE_DIR, "LICENSE"), "utf8");
  const match = /derived from the Feather project:\s*\n\n([^\n]+)\n/.exec(licenseText);
  if (!match) {
    throw new Error("could not find the Feather-derived name list in lucide's LICENSE — upstream wording changed.");
  }
  return match[1].split(",").map((s) => s.trim()).filter(Boolean);
}

function renderGlyphModule(packName, version, entries) {
  const banner = "// GENERATED BY scripts/generate-icon-packs.mjs — DO NOT EDIT\n";
  const license = `/*! @license lucide v${version} - ISC */\n`;
  const lines = entries.map(({ name, shape }) => {
    const body = JSON.stringify(shape);
    return `  ${JSON.stringify(name)}: ${body},`;
  });
  const exportName = `${packName}Glyphs`;
  // A literal key union (not `Record<string, GlyphShape>`) keeps
  // `noUncheckedIndexedAccess` from widening every lookup to
  // `GlyphShape | undefined` for known, listed keys, while pack entry files
  // still index this record with an arbitrary runtime string for the
  // unknown-name contract (src/icons/packs.test.tsx) by going through
  // `(record as Record<string, GlyphShape | undefined>)`.
  const keyUnion = entries.map(({ name }) => JSON.stringify(name)).join(" | ");
  return (
    banner +
    license +
    `import type { GlyphShape } from "../types.js";\n\n` +
    `export const ${exportName}: Record<${keyUnion}, GlyphShape> = {\n` +
    lines.join("\n") +
    "\n};\n"
  );
}

async function buildPack(packName, listed, aliasMap) {
  const included = [];
  const absent = [];
  for (const name of listed) {
    const resolved = resolveName(name, aliasMap);
    if (!resolved) {
      absent.push(name);
      continue;
    }
    const shape = await loadGlyphShape(resolved.canonicalSlug);
    included.push({ name, canonicalSlug: resolved.canonicalSlug, resolvedVia: resolved.resolvedVia, shape });
  }
  return { included, absent };
}

function writeFile(dir, relPath, content) {
  const full = path.join(dir, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  const normalised = content.replace(/\r\n/g, "\n");
  writeFileSync(full, normalised.endsWith("\n") ? normalised : normalised + "\n", "utf8");
}

function updateReadmeIconPacksBlock(readmeDir, packResults, featherDerived) {
  const readmePath = path.join(readmeDir, "README.md");
  if (!existsSync(readmePath)) return;
  let readme = readFileSync(readmePath, "utf8");
  const summary = {};
  for (const name of PACK_NAMES) {
    summary[name] = { count: packResults[name].included.length, absent: packResults[name].absent };
  }
  summary.featherDerived = featherDerived;
  const block = JSON.stringify(summary, null, 2);
  const marker = /<!-- bobuttons:iconpacks:start -->[\s\S]*?<!-- bobuttons:iconpacks:end -->/;
  const replacement = `<!-- bobuttons:iconpacks:start -->\n\`\`\`json\n${block}\n\`\`\`\n<!-- bobuttons:iconpacks:end -->`;
  readme = marker.test(readme) ? readme.replace(marker, replacement) : `${readme}\n\n${replacement}\n`;
  writeFileSync(readmePath, readme, "utf8");
}

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const outIdx = args.indexOf("--out");
  const outDir = writeMode ? root : outIdx !== -1 ? args[outIdx + 1] : null;
  if (!outDir) {
    console.error("usage: generate-icon-packs.mjs --write | --out <dir>");
    process.exit(2);
  }

  const manifest = readManifest();
  const version = lucideVersion();
  if (manifest.lucideVersion !== version) {
    console.error(
      `[generate-icon-packs] FAIL: scripts/icon-packs.json records lucideVersion "${manifest.lucideVersion}" but the installed lucide is "${version}". Update the manifest.`
    );
    process.exit(1);
  }

  const aliasMap = buildAliasMap();
  const packResults = {};
  for (const packName of PACK_NAMES) {
    const listed = manifest.packs[packName].listed;
    packResults[packName] = await buildPack(packName, listed, aliasMap);
  }

  // Feather licence cross-check: every Feather-derived name must resolve
  // through the alias map, unless explicitly allowlisted in
  // featherUnmappable with a reason (a human decision, recorded as data).
  const featherNames = parseFeatherNames();
  const unmappableAllowed = new Map((manifest.featherUnmappable || []).map((e) => [e.name, e.reason]));
  const shippedSlugs = new Set();
  for (const packName of PACK_NAMES) {
    for (const { canonicalSlug } of packResults[packName].included) shippedSlugs.add(canonicalSlug);
  }
  const featherDerived = [];
  for (const featherName of featherNames) {
    const resolved = resolveName(featherName, aliasMap);
    if (!resolved) {
      if (unmappableAllowed.has(featherName)) continue;
      console.error(
        `[generate-icon-packs] FAIL: Feather-derived name "${featherName}" (from lucide's LICENSE) does not resolve through the alias map, and is not listed in scripts/icon-packs.json's featherUnmappable with a reason. Either it resolves (fix the resolver) or it is genuinely gone upstream (add a featherUnmappable entry).`
      );
      process.exit(1);
    }
    if (shippedSlugs.has(resolved.canonicalSlug)) {
      featherDerived.push(resolved.canonicalSlug);
    }
  }
  featherDerived.sort();

  for (const packName of PACK_NAMES) {
    const { included } = packResults[packName];
    const content = renderGlyphModule(
      packName,
      version,
      included.map(({ name, shape }) => ({ name, shape }))
    );
    writeFile(outDir, `src/icons/glyphs/${packName}.generated.ts`, content);
  }

  if (writeMode) {
    const nextManifest = { ...manifest, packs: { ...manifest.packs } };
    for (const packName of PACK_NAMES) {
      const { included, absent } = packResults[packName];
      nextManifest.packs[packName] = {
        listed: manifest.packs[packName].listed,
        included: included.map(({ name, canonicalSlug, resolvedVia }) => ({ name, canonicalSlug, resolvedVia })),
        absent,
        count: included.length,
      };
    }
    nextManifest.featherDerived = featherDerived;
    writeFileSync(MANIFEST_PATH, JSON.stringify(nextManifest, null, 2) + "\n", "utf8");
    updateReadmeIconPacksBlock(outDir, packResults, featherDerived);
    console.log("[generate-icon-packs] wrote generated glyph modules, updated icon-packs.json and README (--write)");
  } else {
    console.log(`[generate-icon-packs] wrote generated glyph modules into ${outDir}`);
  }

  for (const packName of PACK_NAMES) {
    const { included, absent } = packResults[packName];
    console.log(`[generate-icon-packs] ${packName}: ${included.length} included, ${absent.length} absent${absent.length ? ` (${absent.join(", ")})` : ""}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
