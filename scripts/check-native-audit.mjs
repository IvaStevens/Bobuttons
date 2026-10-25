#!/usr/bin/env node
// Cheap static scanner — no Android, no metro, no build. Keeps
// scripts/native-audit.json (B2-AC29) from rotting (schema + referenced
// files exist) and separately enforces `bobuttons/no-implicit-intl`'s INTENT
// on formatInstant.native.ts, which the rule itself can't reach (it is
// scoped to src/components/**, so extending it would flag the sanctioned
// formatInstant.ts/.native.ts funnel module itself).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");

let failed = false;
function fail(msg) {
  console.error(`[check-native-audit] FAIL: ${msg}`);
  failed = true;
}

const DISPOSITIONS = new Set(["handled-by-tamagui", "silently-dropped", "invalid-needs-seam", "visually-wrong-needs-seam"]);

function checkAuditSchema() {
  const auditPath = path.join(root, "scripts/native-audit.json");
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  if (!Array.isArray(audit.entries) || audit.entries.length === 0) {
    fail("native-audit.json has no entries.");
    return;
  }
  for (const entry of audit.entries) {
    if (!entry.file || !entry.construct || !entry.substitute || !entry.disposition) {
      fail(`native-audit.json entry missing a required key: ${JSON.stringify(entry).slice(0, 120)}`);
      continue;
    }
    if (!DISPOSITIONS.has(entry.disposition)) {
      fail(`native-audit.json entry has an unknown disposition "${entry.disposition}": ${entry.file}`);
    }
    // entry.file may list several comma-separated paths (one entry covering
    // several call sites of the same construct/substitute pair). "lines" is
    // a parallel array, same order, same length (review finding: entries
    // previously carried no line number at all, despite B2-AC29's own
    // file:line form).
    const files = entry.file.split(",").map((s) => s.trim());
    if (!Array.isArray(entry.lines) || entry.lines.length !== files.length) {
      fail(`native-audit.json entry's "lines" array must be a parallel array matching "file"'s ${files.length} path(s): ${entry.file}`);
    }
    for (let i = 0; i < files.length; i++) {
      const rel = files[i];
      const abs = path.join(root, rel);
      if (!existsSync(abs)) {
        fail(`native-audit.json references a file that does not exist: ${rel}`);
        continue;
      }
      const line = entry.lines?.[i];
      if (typeof line !== "number" || line < 1) {
        fail(`native-audit.json entry has an invalid line number for "${rel}": ${JSON.stringify(line)}`);
        continue;
      }
      const lineCount = readFileSync(abs, "utf8").split("\n").length;
      if (line > lineCount) {
        fail(`native-audit.json entry points at ${rel}:${line}, but that file only has ${lineCount} line(s) — the reference has rotted.`);
      }
    }
  }
  console.log(`[check-native-audit] native-audit.json: ${audit.entries.length} entries, schema OK.`);
}

// no-implicit-intl's intent (the rule itself is scoped to src/components/**
// and cannot reach formatInstant.ts/.native.ts, the module it exists to
// funnel Intl usage into): both halves must pass an explicit locale AND an
// explicit timeZone/no-timeZone-needed distinction — i.e. neither
// `new Intl.DateTimeFormat(locale, ...)` call omits its options entirely.
function checkFormatInstantExplicitness() {
  for (const rel of ["src/internal/formatInstant.ts", "src/internal/formatInstant.native.ts"]) {
    const text = readFileSync(path.join(root, rel), "utf8");
    const dtCalls = [...text.matchAll(/new Intl\.DateTimeFormat\(([^)]*)\)/g)];
    const nfCalls = [...text.matchAll(/new Intl\.NumberFormat\(([^)]*)\)/g)];
    if (dtCalls.length === 0) {
      fail(`${rel}: expected at least one Intl.DateTimeFormat call.`);
      continue;
    }
    // At least one call per formatter must pass an explicit locale — the
    // PRIMARY call, not necessarily a documented no-ICU fallback branch
    // (formatInstant.native.ts's fallback deliberately omits it to use the
    // engine's own default when the requested locale/timeZone itself
    // failed; that is the defined fallback, not an implicit-Intl violation).
    if (!dtCalls.some((call) => /locale/.test(call[1]))) {
      fail(`${rel}: no Intl.DateTimeFormat call passes a 'locale'-named argument.`);
    }
    if (nfCalls.length > 0 && !nfCalls.some((call) => /locale/.test(call[1]))) {
      fail(`${rel}: no Intl.NumberFormat call passes a 'locale'-named argument.`);
    }
  }
  console.log("[check-native-audit] formatInstant.ts and formatInstant.native.ts both call Intl.*Format with an explicit locale argument.");
}

const A11Y_DISPOSITION_WORDS = new Set(["rn-native", "mapped", "inert-no-rn-equivalent", "none"]);

// B2-AC20: every public export must have a per-export entry in
// native-audit.json's accessibilityAudit array, enumerating its role/aria-*/
// tabIndex props against RN's supported accessibility surface. Required set
// is component-inventory.json's components plus BobuttonsProvider (the one
// export check-inventory-coverage.mjs itself special-cases) — mirrors the
// fixture-coverage idea from the original B2-AC27 (de-scoped per the
// approved scope change) without requiring a committed harness.
function checkAccessibilityAuditCoverage() {
  const auditPath = path.join(root, "scripts/native-audit.json");
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  if (!Array.isArray(audit.accessibilityAudit) || audit.accessibilityAudit.length === 0) {
    fail("native-audit.json has no accessibilityAudit entries (B2-AC20).");
    return;
  }
  const seen = new Set();
  for (const entry of audit.accessibilityAudit) {
    if (!entry.export || !Array.isArray(entry.props) || !entry.disposition || !entry.notes) {
      fail(`accessibilityAudit entry missing a required key: ${JSON.stringify(entry).slice(0, 120)}`);
      continue;
    }
    if (seen.has(entry.export)) fail(`accessibilityAudit has a duplicate export entry: "${entry.export}"`);
    seen.add(entry.export);
    for (const word of entry.disposition.split("+").map((s) => s.trim())) {
      if (!A11Y_DISPOSITION_WORDS.has(word)) {
        fail(`accessibilityAudit entry for "${entry.export}" has an unknown disposition word "${word}".`);
      }
    }
  }
  const inventoryPath = path.join(root, "scripts/component-inventory.json");
  const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
  const required = new Set(inventory.components.map((c) => c.name));
  required.add("BobuttonsProvider");
  const missing = [...required].filter((name) => !seen.has(name));
  if (missing.length > 0) {
    fail(`accessibilityAudit is missing an entry for: ${missing.join(", ")}`);
  }
  console.log(`[check-native-audit] accessibilityAudit: ${audit.accessibilityAudit.length} entries, covers all ${required.size} public exports.`);
}

checkAuditSchema();
checkFormatInstantExplicitness();
checkAccessibilityAuditCoverage();

if (failed) process.exit(1);
console.log("[check-native-audit] PASS");
