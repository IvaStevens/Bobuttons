// CJS entry. The .cjs build must execute, not just typecheck: bundling
// ESM-only @tamagui/* into CJS is the likeliest late failure.
import * as React from "react";
import { renderToString } from "react-dom/server";
import { BobuttonsProvider, bobuttonsConfig, themeNames, Button, Icon } from "bobuttons";
// BOBUTTONS-4: an opt-in icon pack, imported from its own subpath.
import { Cat } from "bobuttons/icons/animal";
import type { BobuttonsThemeName } from "bobuttons";

void bobuttonsConfig;
void themeNames;

const theme: BobuttonsThemeName = "jade";

const markup = renderToString(
  React.createElement(BobuttonsProvider, {
    theme,
    children: React.createElement(Button, { label: "Hello from CJS" }),
  })
);

if (!markup || markup.length === 0) {
  throw new Error("[scratch-consumer CJS] FAIL: renderToString produced empty markup");
}

// A pack icon renders through the existing Icon component (no new mechanism).
const iconMarkup = renderToString(
  React.createElement(BobuttonsProvider, {
    theme,
    children: React.createElement(Icon, { source: Cat, size: 24 }),
  })
);

if (!iconMarkup.includes("<svg") || !iconMarkup.includes("<path")) {
  throw new Error("[scratch-consumer CJS] FAIL: pack icon (bobuttons/icons/animal) did not render an <svg><path>");
}
console.log(`[scratch-consumer CJS] OK (${markup.length} bytes)`);
