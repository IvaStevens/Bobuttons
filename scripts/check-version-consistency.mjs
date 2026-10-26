#!/usr/bin/env node
// Reads marker-delimited JSON blocks from README.md (never prose) and asserts
// they agree with package.json and the built dist. Fails on a missing marker
// pair or invalid JSON. --write regenerates the versions table.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const write = process.argv.includes("--write");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const readmePath = path.join(root, "README.md");
let readme = readFileSync(readmePath, "utf8");

let failed = false;
function fail(msg) {
  console.error(`[check-version-consistency] FAIL: ${msg}`);
  failed = true;
}

function extractBlock(name) {
  const re = new RegExp(
    `<!-- bobuttons:${name}:start -->[\\s\\S]*?\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`[\\s\\S]*?<!-- bobuttons:${name}:end -->`
  );
  const match = readme.match(re);
  if (!match) {
    fail(`missing marker pair bobuttons:${name}:start/end in README.md`);
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    fail(`bobuttons:${name} block is not valid JSON: ${e.message}`);
    return null;
  }
}

const versions = extractBlock("versions");
const distsize = extractBlock("distsize");

if (versions) {
  const expectedVite = pkg.devDependencies.vite;
  const expectedStorybook = pkg.devDependencies.storybook;
  const expectedTamagui = pkg.devDependencies["@tamagui/core"];
  const expectedTs = pkg.devDependencies.typescript;
  if (versions.vite !== expectedVite) fail(`README vite=${versions.vite} != package.json=${expectedVite}`);
  if (versions.storybook !== expectedStorybook) fail(`README storybook=${versions.storybook} != package.json=${expectedStorybook}`);
  if (versions["@tamagui/core"] !== expectedTamagui) fail(`README @tamagui/core=${versions["@tamagui/core"]} != package.json=${expectedTamagui}`);
  if (versions.typescript !== expectedTs) fail(`README typescript=${versions.typescript} != package.json=${expectedTs}`);
}

// Re-measures the bundles check-dist-size.mjs measures, in its per-bundle
// shape (B2-AC21: version-consistency checks apply to ALL shipped bundles —
// a strengthening of this check, called out as such in the PR). Runs after
// the build in verify, so dist/ exists.
if (distsize) {
  for (const name of ["index.mjs", "index.cjs", "index.native.js"]) {
    const entryPath = path.join(root, "dist", name);
    const recorded = distsize[name];
    if (!recorded) {
      fail(`README distsize block has no entry for "${name}". Run \`node scripts/check-dist-size.mjs --write\`.`);
      continue;
    }
    if (existsSync(entryPath)) {
      const buf = readFileSync(entryPath);
      const rawBytes = buf.length;
      const gzipBytes = gzipSync(buf).length;
      if (recorded.rawBytes !== rawBytes) {
        fail(`README distsize["${name}"].rawBytes=${recorded.rawBytes} != measured dist/${name}=${rawBytes}B. Run \`node scripts/check-dist-size.mjs --write\`.`);
      }
      if (recorded.gzipBytes !== gzipBytes) {
        fail(`README distsize["${name}"].gzipBytes=${recorded.gzipBytes} != measured dist/${name} gzip=${gzipBytes}B. Run \`node scripts/check-dist-size.mjs --write\`.`);
      }
    } else {
      fail(`dist/${name} not found — check-version-consistency must run after the build step.`);
    }
  }
}

if (pkg.dependencies && (pkg.dependencies.react || pkg.dependencies["react-dom"])) {
  fail(`react/react-dom must appear only in peerDependencies, found in dependencies.`);
}
if (!pkg.peerDependencies || !pkg.peerDependencies.react || !pkg.peerDependencies["react-dom"]) {
  fail(`react/react-dom must be declared in peerDependencies.`);
}

if (write) {
  const table = [
    "| package | version |",
    "|---|---|",
    `| vite | ${pkg.devDependencies.vite} |`,
    `| storybook | ${pkg.devDependencies.storybook} |`,
    `| @tamagui/core | ${pkg.devDependencies["@tamagui/core"]} |`,
    `| typescript | ${pkg.devDependencies.typescript} |`,
  ].join("\n");
  const tableMarker = /<!-- bobuttons:versions-table:start -->[\s\S]*?<!-- bobuttons:versions-table:end -->/;
  const replacement = `<!-- bobuttons:versions-table:start -->\n${table}\n<!-- bobuttons:versions-table:end -->`;
  readme = tableMarker.test(readme) ? readme.replace(tableMarker, replacement) : `${readme}\n\n${replacement}\n`;
  writeFileSync(readmePath, readme, "utf8");
  console.log("[check-version-consistency] README versions table updated (--write)");
  process.exit(0);
}

if (failed) process.exit(1);
console.log("[check-version-consistency] PASS");
