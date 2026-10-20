// AC15: ESM entry. Imports BobuttonsProvider, bobuttonsConfig and one
// component (Button) from the package root, typechecks under both
// moduleResolution bundler and node16, and renders through
// react-dom/server's renderToString under plain Node, asserting non-empty
// markup. Explicit .mts extension (not a bare index.ts) — docs/context §F7:
// a bare pair silently typechecks the wrong resolution mode under node16.
import * as React from "react";
import { renderToString } from "react-dom/server";
import { BobuttonsProvider, bobuttonsConfig, themeNames, Button } from "bobuttons";
import type { BobuttonsThemeName } from "bobuttons";

void bobuttonsConfig;
void themeNames;

const theme: BobuttonsThemeName = "ocean";

const markup = renderToString(
  React.createElement(BobuttonsProvider, {
    theme,
    children: React.createElement(Button, { label: "Hello from ESM" }),
  })
);

if (!markup || markup.length === 0) {
  throw new Error("[scratch-consumer ESM] FAIL: renderToString produced empty markup");
}
console.log(`[scratch-consumer ESM] OK (${markup.length} bytes)`);
