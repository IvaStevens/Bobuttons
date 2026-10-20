// AC15: CJS entry. The .cjs build has to actually execute, not merely
// typecheck — bundling ESM-only @tamagui/* into CJS is the likeliest late
// failure (docs/context §B1). Explicit .cts extension, same reasoning as
// index.mts (§F7).
import * as React from "react";
import { renderToString } from "react-dom/server";
import { BobuttonsProvider, bobuttonsConfig, themeNames, Button } from "bobuttons";
import type { BobuttonsThemeName } from "bobuttons";

void bobuttonsConfig;
void themeNames;

const theme: BobuttonsThemeName = "jade-aa";

const markup = renderToString(
  React.createElement(BobuttonsProvider, {
    theme,
    children: React.createElement(Button, { label: "Hello from CJS" }),
  })
);

if (!markup || markup.length === 0) {
  throw new Error("[scratch-consumer CJS] FAIL: renderToString produced empty markup");
}
console.log(`[scratch-consumer CJS] OK (${markup.length} bytes)`);
