// ESM entry: imports the public API from the package root, typechecks under
// bundler and node16 resolution, and renders to non-empty markup. The explicit
// .mts extension keeps node16 from typechecking the wrong module mode.
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
