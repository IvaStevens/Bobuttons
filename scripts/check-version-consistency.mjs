#!/usr/bin/env node
// AC20 + docs/context §N11. Reads marker-delimited fenced JSON blocks from
// README.md (never prose) and asserts they agree with package.json /
// dist-size-budget.json. Fails on a missing marker pair or invalid JSON.
// --write regenerates the human-readable table next to the block.
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

// Review finding (low): `distsize` was extracted but never compared against
// anything, so the README-recorded dist size could drift silently from the
// real measurement while still passing (it only checked "is this valid
// JSON?"). This step runs last in verify.mjs (step 17), after the build
// (step 8), so dist/ is guaranteed to exist — re-measure the same entry
// check-dist-size.mjs measures and assert the README block still matches.
if (distsize) {
  const entryPath = path.join(root, "dist/index.mjs");
  if (existsSync(entryPath)) {
    const buf = readFileSync(entryPath);
    const rawBytes = buf.length;
    const gzipBytes = gzipSync(buf).length;
    if (distsize.rawBytes !== rawBytes) {
      fail(`README distsize.rawBytes=${distsize.rawBytes} != measured dist/index.mjs=${rawBytes}B. Run \`node scripts/check-dist-size.mjs --write\`.`);
    }
    if (distsize.gzipBytes !== gzipBytes) {
      fail(`README distsize.gzipBytes=${distsize.gzipBytes} != measured dist/index.mjs gzip=${gzipBytes}B. Run \`node scripts/check-dist-size.mjs --write\`.`);
    }
  } else {
    fail("dist/index.mjs not found — check-version-consistency must run after the build step.");
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
