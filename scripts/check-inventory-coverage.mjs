#!/usr/bin/env node
// AC1/AC2/AC10 + docs/context §N7. For each entry in
// scripts/component-inventory.json: asserts a *.stories.tsx exists, the
// component is exported from src/index.ts, the component exports a
// `<Name>Props` interface, and (N7's mechanical proxy for AC2's second half)
// every declared prop key is covered by the union of the default story's
// args and every named story's args. `children` and `aria-*`/`data-*` are
// exempt; an individual prop may be exempted via a visible
// `/** @storybook-args-exempt <reason> */` JSDoc tag directly above it.
//
// Only checks entries actually present in component-inventory.json, so the
// gate stays meaningful per-slice (AC21) instead of being a blanket skip —
// the manifest grows as components land; this script never invents
// expectations for components that are not yet in it.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const manifest = JSON.parse(readFileSync(path.join(root, "scripts/component-inventory.json"), "utf8"));
const indexTs = readFileSync(path.join(root, "src/index.ts"), "utf8");

let failed = false;
function fail(msg) {
  console.error(`[check-inventory-coverage] FAIL: ${msg}`);
  failed = true;
}

function extractPropsInterface(source, name) {
  const re = new RegExp(`export interface ${name}Props\\b[^{]*\\{([\\s\\S]*?)\\n\\}`, "m");
  const match = re.exec(source);
  return match ? match[1] : null;
}

function declaredPropsWithExemptions(body) {
  const lines = body.split("\n");
  const props = [];
  let pendingExempt = null;
  for (const line of lines) {
    const exemptMatch = /@storybook-args-exempt\b/.exec(line);
    if (exemptMatch) {
      pendingExempt = true;
      continue;
    }
    const propMatch = /^\s*(?:\/\*\*.*\*\/\s*)?"?([A-Za-z0-9_-]+)"?\??:/.exec(line);
    if (propMatch) {
      props.push({ name: propMatch[1], exempt: pendingExempt === true });
      pendingExempt = null;
    }
    if (/^\s*\*/.test(line) || /^\s*$/.test(line)) continue;
    if (!propMatch) pendingExempt = null;
  }
  return props;
}

function storyArgsKeys(storiesSource) {
  const keys = new Set();
  const argsBlocks = [...storiesSource.matchAll(/args:\s*\{([^}]*)\}/g)];
  for (const block of argsBlocks) {
    const body = block[1];
    const matches = [...body.matchAll(/"?([A-Za-z0-9_-]+)"?\s*:/g)];
    for (const m of matches) keys.add(m[1]);
  }
  return keys;
}

const EXEMPT_PATTERN = /^(children|aria-.*|data-.*)$/;

for (const entry of manifest.components) {
  const { name, sourcePath, storiesPath } = entry;
  const absSource = path.join(root, sourcePath);
  const absStories = path.join(root, storiesPath);

  if (!existsSync(absSource)) {
    fail(`${name}: sourcePath ${sourcePath} does not exist.`);
    continue;
  }
  if (!existsSync(absStories)) {
    fail(`${name}: storiesPath ${storiesPath} does not exist (AC1: every inventory item needs a story).`);
    continue;
  }
  if (!new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(indexTs) && !new RegExp(`export\\s+(function|const)\\s+${name}\\b`).test(indexTs)) {
    fail(`${name}: not exported from src/index.ts (AC10).`);
  }

  const source = readFileSync(absSource, "utf8");
  const propsBody = extractPropsInterface(source, name);
  if (propsBody === null) {
    fail(`${name}: no exported "${name}Props" interface found in ${sourcePath} (AC2).`);
    continue;
  }

  const declaredProps = declaredPropsWithExemptions(propsBody);
  const storiesSource = readFileSync(absStories, "utf8");
  const covered = storyArgsKeys(storiesSource);

  for (const prop of declaredProps) {
    if (prop.exempt) continue;
    if (EXEMPT_PATTERN.test(prop.name)) continue;
    if (!covered.has(prop.name)) {
      fail(`${name}: declared prop "${prop.name}" is not covered by any story's args (N7). Add it to a story's args or mark it with /** @storybook-args-exempt <reason> */.`);
    }
  }
}

if (failed) process.exit(1);
console.log(`[check-inventory-coverage] PASS (${manifest.components.length} inventory entries checked)`);
