# Bobuttons

Private React ([Tamagui](https://tamagui.dev/docs)) component library. Storybook is the review and
design surface — see `.storybook/` and `npm run storybook`.

This package is `private: true` and is **never published**. It is consumed only via `file:`/tarball
installs (see `scripts/scratch-consumer/`), by three internal consumers.

## Status (BOBUTTONS-1)

Delivered in this pass: **Slice 0** in full (packaging, build, lint, both typechecks, dist audits,
pack/integrity checks, dependency checks, CI) and most of **Slice 1** — eight themes with 34-key
parity generated from `themes.source.css`, the Tamagui token config (radius/space/size/
zIndex/font scales, including the named `fontWeights` scale), `BobuttonsProvider` with the AC9 remount
regression test, Storybook 10 wired with the theme toolbar and a genuinely-gating a11y check
(`npm run verify` builds Storybook and runs two Vitest/Playwright browser projects against it — the
`storybook-jade` project additionally gates on axe's colour-contrast rule, per AC16; the
`storybook-default` project does not), and one primitive (`Button`) with theme-switch stories and
hover/focus/press play functions. `npm run verify`'s full 18-step gate passes end to end, including
the AC15 scratch-install check (ESM + CJS entries actually executed through `renderToString` from a
throwaway fixture directory outside this repo, with no ancestor `node_modules` to leak from) and the
AC10 exports-encapsulation assertion (a deep import by bare specifier fails with
`ERR_PACKAGE_PATH_NOT_EXPORTED` at runtime and `TS2307` at typecheck, under both `moduleResolution`
settings).

This pass also fixed a round of review findings from the prior implementation: an invalid
`$border` token reference in `Button.tsx` (should be `$borderColor`; Tamagui silently emitted the
literal into the stylesheet rather than throwing — `npm run verify`'s Storybook/Vitest run now fails
on any `[tamagui]` console warning, see `src/test/no-tamagui-warnings.setup.ts`); a byte-copied
`dist/index.d.cts` whose relative imports pointed at ESM-kind sibling declarations (TS1479 under
node16 with default `skipLibCheck`) — `scripts/build.mjs` now emits a fully self-consistent CJS
declaration tree; a transitive `@tamagui/web` leak reachable from `dist/index.d.ts` via
`tamagui.config.d.ts` (TS2307) — `themeNames`/`BobuttonsThemeName`/`fontWeights` are now re-exported
from `@tamagui/*`-free leaf modules instead; a numeric-literal gap in `no-raw-style-literals.js`
(`borderWidth: 1`, `opacity: 0.5` passed a string-only regex); and the scratch-install isolation
issues above.

**Not delivered in this pass (see ImplementationResult blockers for detail):** the remaining ~37
components of the Slice 2 inventory (app shell, other primitives, domain components, views, settings
tabs — only `Button` exists); `Icon`/`IconSource`/`BobuttonsTab` are specified in docs but not
implemented.

## Versions

<!-- bobuttons:versions:start -->
```json
{ "vite": "8.3.4", "storybook": "10.6.2", "@tamagui/core": "3.0.18",
  "typescript": "6.0.3", "requiresTamaguiVitePlugin": false, "vitePluginRequiresVite": ">=8" }
```
<!-- bobuttons:versions:end -->

<!-- bobuttons:versions-table:start -->
| package | version |
|---|---|
| vite | 8.3.4 |
| storybook | 10.6.2 |
| @tamagui/core | 3.0.18 |
| typescript | 6.0.3 |
<!-- bobuttons:versions-table:end -->

`@tamagui/vite-plugin` is **not** a dependency of this package: it requires Vite >=8 and this project
does not use the Tamagui compiler (`@storybook/react-vite` itself only requires Vite 5-8). The
AppGenerator template currently pins Vite 7.3.7; adopting `@tamagui/vite-plugin` there would need a
Vite bump first, which is out of scope here.

TypeScript is pinned to 6.0.3, not the published latest (7.0.2): `typescript-eslint@8.72.0` declares
`typescript: ">=4.8.4 <6.1.0"` and does not support TypeScript 7.

## Dist size (AC19)

<!-- bobuttons:distsize:start -->
```json
{
  "rawBytes": 397826,
  "gzipBytes": 95770
}
```
<!-- bobuttons:distsize:end -->

Measured for `dist/index.mjs` (the ESM entry) against the budget in `dist-size-budget.json`. Re-run
`node scripts/check-dist-size.mjs --write` after a build to refresh this block; `npm run verify`
fails if it drifts from the committed budget.

## Packaging notes

- `@tamagui/core` is bundled into `dist/` and declared as a **devDependency**, never a runtime
  dependency. Its transitive `@tamagui/react-native-media-driver` declares a non-optional
  `react-native-web` peer; if `@tamagui/core` were a runtime dependency, every consumer install would
  pull `react-native-web` and AC12(b) ("the scratch consumer's installed tree contains no
  react-native* package") would fail through no fault of the build. This package therefore ships
  **no `dependencies` field at all** — only `peerDependencies` on `react`/`react-dom` (`>=19`).
- `griddy-icons` is a story-only devDependency, never imported from `src/`. It never reaches `dist/`.
- The library injects a small hand-written stylesheet in `BobuttonsProvider`, scoped to its own data
  attributes, for the things no style prop can express. Everything else comes from Tamagui's token system.
  - `[data-bobuttons-icon] svg path { fill: currentColor; }` — a port of
    `DailyTracker/src/styles/global.css:261`'s workaround for griddy-icons that hardcode `fill="black"`
    on an inner `<path>`.
  - `[data-bobuttons-input]::placeholder { color: var(--textFaint); }` — a placeholder colour can't be set
    through a style prop.
  - `[data-bobuttons-input]::-webkit-inner-spin-button` — restyles the browser's own number spinner:
    its box is removed and its arrows are redrawn as chevrons in theme colours. It stays the native
    control, so stepping and keyboard behaviour are unchanged. Firefox can't style its spinner, so
    `-moz-appearance: textfield` hides it there (the arrow keys and mouse wheel still step).
  - `[data-bobuttons-tile] { box-shadow: var(--bobuttons-tile-shadow, none); }` — Tamagui parses
    `boxShadow` and rejects modern colour syntax.
- `exports` exposes exactly `"."` and `"./package.json"`. Deep imports fail by design (AC10).

## Scripts

- `npm run build` — the single build (tsup for ESM+CJS JS, `tsc --emitDeclarationOnly` for `.d.ts`,
  then copied to `.d.mts`/`.d.cts`).
- `npm run verify` — the one gate (AC18): dependency/package/theme checks, lint, both typechecks,
  build, dist audits, inventory coverage, pack + integrity checks, the scratch-install check,
  `build-storybook`, and the Storybook a11y Vitest run (requires a Playwright Chromium browser —
  `npx playwright install chromium`). See `scripts/verify.expected-skips.json` for which steps are
  allowed to self-report SKIP at the current slice (AC21); it is currently empty.
- `npm run generate-themes:write` — regenerates `src/themes/themes.generated.ts` and
  `docs/api/token-mapping.md` from `src/themes/themes.source.css`.
