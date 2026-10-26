# Bobuttons

Private React ([Tamagui](https://tamagui.dev/docs)) component library. Storybook is the review and
design surface — see `.storybook/` and `npm run storybook`.

This package is `private: true` and is **never published**. It is consumed only via `file:`/tarball
installs (see `scripts/scratch-consumer/`), by three internal consumers.

## Status (BOBUTTONS-1)

Delivered in this pass: **Slice 0** in full (packaging, build, lint, both typechecks, dist audits,
pack/integrity checks, dependency checks, CI) and most of **Slice 1** — eight themes with 34-key
parity and a named colour palette, generated from `themes.source.css`, the Tamagui token config (radius/space/size/
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

## Dist size (B1-AC19)

<!-- bobuttons:distsize:start -->
```json
{
  "index.mjs": {
    "rawBytes": 408750,
    "gzipBytes": 98796
  },
  "index.cjs": {
    "rawBytes": 415107,
    "gzipBytes": 99418
  },
  "index.native.js": {
    "rawBytes": 577593,
    "gzipBytes": 125261
  }
}
```
<!-- bobuttons:distsize:end -->

Measured per shipped bundle (web ESM, web CJS, native — B2-AC22) against `dist-size-budget.json`.
Re-run `node scripts/check-dist-size.mjs --write` after a build to refresh this block; `npm run
verify` fails if any bundle drifts from or exceeds its committed budget. The two web bundles are
`pinned: true` — **not** still at their N0, byte-identical-to-`main` measurement (recorded below as
`n0Reference`, for provenance only); the pinned limit has moved twice since N0, both moves recorded
here and in `dist-size-budget.json`'s `_comment`, and `pinned: true` means it may not move again
without the same explicit callout and the ticket owner's sign-off. The native bundle's limit was set
at its own N0 measurement plus the same relative headroom the web budget has historically used, and
is expected to grow across the native-support slices.

**Pinned web budget raised five times since N0, every raise flagged for explicit owner sign-off
(B2-AC22):**

1. **First raise, at the seam slice (N2):** both bundles grew from their `n0Reference` values
   (`index.mjs`: 402570 raw / 97392 gzip, sha256 `5dccbda8…`; `index.cjs`: 408771 raw / 98027 gzip,
   sha256 `51ce7ec6…`) to a new pinned limit, reflecting the seam-restructuring overhead itself —
   extra module boundaries for `Scroll`/`TextField`/`CheckGlyph`/`TessellatedPattern`/etc. — not dead
   code.
2. **Second raise, at the internal-review-fix pass:** both pinned limits moved again (`index.mjs`
   407636/98528, `index.cjs` 413993/99156). This is **not** seam-restructuring growth being absorbed
   into a re-baseline — it is the byte cost of fixing three web regressions the review caught in the
   seam refactor itself (`TabBar`'s dropped keyboard activation and `scrollPaddingInline`, `Button`'s
   focus ring persisting after a mouse leave) plus one native defect fix (`SquareGrid`'s
   `currentColor`). Restoring the exact pre-existing web behaviour required re-adding the handful of
   bytes the regression had removed.
3. **Third raise, review round 3 (B2-AC20/D7 touch targets, first pass):** both pinned limits moved
   again (`index.mjs` 408061/98627, `index.cjs` 414418/99253), for the `hitSlop={touchHitSlop(...)}`
   call sites added to `IconButton`, `Tabs`' `Tab`, `CollapsibleSection`'s `Header`, `SquareGrid`'s
   `Square`, `TabBar`'s `TabButton` and `TextField.native.tsx`'s checkbox `Pressable` — a NATIVE-ONLY
   behaviour change (`touchHitSlop` is a no-op returning `undefined` on web), but B2-AC1's
   one-shared-source rule means the call sites themselves still compile into the web bundle.
4. **Fourth raise, review round 3 follow-up (current values, see the block above):** a later review
   pass found the ~48dp rule applied in only one place, and that `TextField.native.tsx`'s own
   checkbox `hitSlop` could not actually reach 48dp (Android's touch dispatch clips a view's `hitSlop`
   to its immediate parent's bounds — see "Touch-target rule" below). This raise covers the fix:
   `Button`, `ListRow`'s radio control, `TabBar`'s two scroll arrows, `Checkbox`'s `Row` and `Radio`'s
   title-only card all needed touch-target growth, and the real fix for the checkbox moved the growth
   to `Checkbox.tsx`'s `Row`. `Button` and `Radio` already call `useInteractive`/
   `useButtonInteraction`, so their growth is threaded through the SAME `handlers` object every caller
   already spreads (a new optional `HitSlopSize` argument that `interaction.ts` ignores and only
   `interaction.native.ts` turns into a `hitSlop` key) — **zero new web bytes for those two.**
   `ListRow`'s radio View, `TabBar`'s two `Arrow` views and `Checkbox`'s `Row` have no existing
   `handlers` object to piggyback on and each still needs its own `hitSlop={touchHitSlop(...)}` line;
   that is the entire measured delta of this raise.
5. **Fifth raise, review round 4 finding 1 (current values, see the block above):** review found
   `IconButton`'s `hitSlop` was silently INERT on native — its host, `Frame`, was a
   `styled(Text, ...)`, and Android only honours hit-area growth (`ReactHitSlopView`) on a `View`, not
   a `Text` host. The fix moves `Frame`'s definition out of `IconButton.tsx` and into the EXISTING
   `platformStyles.ts`/`.native.tsx` seam under the SAME exported name (`Frame`), deliberately
   avoiding a brand-new seam file/module boundary; the native half becomes a `View`-owned press target
   wrapping an inner `Text` only so a raw string `children` still renders legally on native. RAW bytes
   for both web bundles are measured **unchanged** from the fourth raise (408692/415049 — the
   relocated declaration is the same length, under the same name); only GZIP moved, by at most 18
   bytes (`index.mjs`) / 5 bytes (`index.cjs`), which is moving a byte-identical declaration to a
   different position in the file changing gzip's match distances, not new content. A dedicated new
   seam file (the first attempt) cost 55/15 bytes instead and was rejected for that reason.

All five raises are enumerated here (not only in `dist-size-budget.json`'s `_comment`) and all five
need the ticket owner's explicit sign-off before merge, per B2-AC22/B2-AC11. The recorded
`n0Reference` sha256 values are provenance notes only — no script re-verifies them (the working tree
has moved on from N0 by design, via the raises above), so "byte-identical to `main` at N0" is a
historical fact about the packaging slice, not a currently-checked invariant.

## Packaging notes

- `@tamagui/core` is bundled into `dist/` and declared as a **devDependency**, never a runtime
  dependency, on BOTH the web and native builds (B2-AC9: exactly one `@tamagui/core` instance on the
  native path, as a bundled devDependency, not a peer — Tamagui 3.0.18's native build has zero web
  dependencies of its own). Its transitive `@tamagui/react-native-media-driver` declares a non-optional
  `react-native-web` peer; if `@tamagui/core` were a runtime dependency, every consumer install would
  pull `react-native-web` and B1-AC12(b) ("the scratch consumer's installed tree contains no
  react-native* package") would fail through no fault of the build. This package therefore ships
  **no `dependencies` field at all** — only `peerDependencies`: `react`/`react-dom` (`>=19`, **`react-dom`
  optional** — see "React Native (Android) support" below) and `react-native` (`>=0.79 <1.0`, **optional**).
- The native bundle imports one React Native **internal** module,
  `react-native/Libraries/Pressability/usePressability`. `@tamagui/web` calls
  `require("react-native").usePressability`, which Metro cannot resolve as written, and React Native's
  public index does not export it (0.83). `scripts/esbuild-native-resolve.ts` rewrites that one
  expression into a static import of the internal module, and `scripts/check-native-bundle.mjs`
  allow-lists exactly that path and fails on any non-static `__require("...")` call. If a React Native
  release in the supported range moves that file, the native bundle needs updating.
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
- `exports` exposes exactly `"."` and `"./package.json"`. Deep imports fail by design (B1-AC10). The
  `"."` entry now carries a `"react-native"` condition (checked first, before `"import"`/`"require"`)
  alongside the existing ESM/CJS conditions — see "React Native (Android) support" below.

## Scripts

- `npm run build` — the single build: tsup for the web ESM+CJS bundles, then tsup again (a separate
  native config) for `dist/index.native.js`, then `tsc --emitDeclarationOnly` for the one shared
  `.d.ts` (copied to `.d.mts`/`.d.cts`). Order matters — see `tsup.native.config.ts`'s comment.
- `npm run verify` — the one gate (B1-AC18): dependency/package/theme checks, lint, both web
  typechecks, both native typechecks, build, web dist audits, `check-native-bundle` (the
  environment-independent native gate — see below), inventory coverage, `check-native-coverage`, pack
  + integrity checks, the scratch-install check, `build-storybook`, and the Storybook a11y Vitest run
  (requires a Playwright Chromium browser — `npx playwright install chromium`). See
  `scripts/verify.expected-skips.json` for which steps are allowed to self-report SKIP at the current
  slice (B1-AC21); it is currently empty — the on-device/emulator render check this ticket's TaskSpec
  originally specified is NOT wired into this repo's `npm run verify` at all (see "React Native
  (Android) support" below for why and what replaces it).
- `npm run verify:native` — runs just `check-native-bundle.mjs` on its own (after `npm run build` and
  `npm run pack`), for faster iteration on the native gate.
- `npm run typecheck:native:bundler` / `npm run typecheck:native:node16` — the two native,
  entry-rooted, DOM-free typechecks (see below).
- `npm run generate-themes:write` — regenerates `src/themes/themes.generated.ts` from
  `src/themes/themes.source.css`.
  Colours are defined once, by name, in the `:root` palette of `themes.source.css` (`--color-deep-sea`);
  the themes refer to them with `var(--color-deep-sea)`. The palette is a config-level colour token set
  (`$deepSea`), is exported as `palette`, and is listed in Storybook under Primitives / Colors. To add a
  colour, add a `--color-<name>` line to `:root` and regenerate.

## React Native (Android) support (B2-AC0 onward)

**AC numbering note (B2-AC0):** every AC referenced in this section is this ticket's own numbering
(`B2-AC<n>`), distinct from BOBUTTONS-1's `AC<n>` numbers used elsewhere in this file (now rewritten
to `B1-AC<n>` only inside the sections above that this ticket edited).

**Scope note:** on-device/emulator verification (does a component actually render correctly on an
Android device — B2-AC2, the "looks right on Android" half of B2-AC4, and the B2-AC16 visual parity
review) is done **by hand** by the library owner in a throwaway scratch React Native app kept
*outside* this repository (not committed, not pushed, never a `npm run verify` step). Nothing in
`scripts/native-harness/`, no fixtures module, and no on-device CI job exists in this repo. What
`npm run verify` DOES check automatically, with no Android SDK, JDK, emulator or device, is listed
below under "What `check-native-bundle.mjs` proves".

### One source, platform seams at the leaf (B2-AC1)

There is one component source tree (`src/components/**`) and one public entry point
(`src/index.ts`), used by both Electron/web and React Native Android. Platform differences live ONLY
in small internal files under `src/internal/**`, `src/tokens/**` and `src/provider/**`, each as a
`foo.ts(x)` / `foo.native.ts(x)` pair. **No component has a `.native.tsx` twin** — every seam is a
primitive, hook or style constant a component imports, never the component itself.

The seam resolves at **build time**, not at runtime and not in a consumer's own bundler:
- The web build (`tsup.config.ts`) resolves every import to its plain `.ts(x)` file, exactly as
  before this ticket.
- The native build (`tsup.native.config.ts`) uses a small esbuild plugin
  (`scripts/esbuild-native-resolve.ts`) that, for every relative import, checks whether a
  `.native.ts(x)` sibling exists next to the file the import would otherwise resolve to, and redirects
  there if so. This plugin exists because esbuild (tsup's bundler) has no built-in equivalent of
  Metro's or TypeScript's platform-extension resolution for specifiers that already carry an explicit
  extension (every relative import in this repo uses an explicit `.js` specifier, required by the
  Node16/ESM resolution this package also typechecks under) — **measured**: without this plugin, the
  native build silently bundled the WEB half of every seam while every other gate (including the
  entry-rooted native typecheck, which uses TypeScript's own, unrelated `moduleSuffixes` feature) stayed
  green. `check-native-bundle.mjs`'s token scan is what would have caught this had it shipped.
- Consumers receive ONE pre-bundled file per platform (`dist/index.mjs`/`dist/index.cjs` for web,
  `dist/index.native.js` for native) — the `.native.ts(x)` siblings are never published (`files:
  ["dist"]`) and a consumer's own bundler never sees them or needs any platform-extension
  configuration of its own.

### Installing on React Native Android (B2-AC7, B2-AC25)

```
npm install bobuttons react react-native
```

No custom metro resolver, alias, or transform configuration is required. Resolution works through:
1. the `"react-native"` condition inside `package.json`'s `exports["."]` (declared FIRST, before
   `"import"`/`"require"` — conditions match in declaration order, and a React Native Jest
   environment activates both `"require"` and `"react-native"` at once, so order is load-bearing);
2. the top-level `"react-native": "./dist/index.native.js"` field, for tooling that only reads that
   legacy field;
3. the native entry filename itself being plain `.js` — metro's default `sourceExts` are exactly
   `["js","jsx","json","ts","tsx"]`, so a `.mjs`/`.cjs` native entry would never resolve. This is also
   why there is no `dist/index.native.cjs` (decision D9): the native bundle is **ESM only**.

This requires metro >=0.82 / `@react-native/metro-config` >=0.79, the first release line whose metro
honours package `exports` (`unstable_enablePackageExports`) by default — see the support matrix below.

### What a native consumer must do differently (B2-AC25)

- Install `react-native` (a peer, not auto-installed — see "Dependencies" below).
- **No metro config, resolver or transform edits.**
- **Jest caveat (decision D9):** React Native's default Jest preset sets
  `customExportConditions = ["require", "react-native"]` and does not transform
  `node_modules/bobuttons` by default. Since the native entry is ESM-only (see above), a consumer's
  Jest run that imports `bobuttons` will fail to parse it unless `bobuttons` is added to Jest's
  `transformIgnorePatterns` override (e.g. `transformIgnorePatterns: ["node_modules/(?!(bobuttons)/)"]`).
  This is a consumer-side Jest configuration note, not a metro/bundler requirement, so it does not
  conflict with B2-AC7's "no consumer-side hacks" (which is about resolution, not test tooling) — it
  is called out here, and relayed to APPGENERATOR-2/APPGENERATOR-3, because a generated app's own test
  setup will hit it.

### Dependencies (B2-AC6, B2-AC8, B2-AC9, B2-AC10, B2-AC23)

- `react-native` is an **optional peer**, `">=0.79 <1.0"` (decision D2). A web-only consumer installs
  nothing extra; a native consumer installs `react-native` itself.
- `react-dom` is now also an **optional peer** (decision D6, authorised under B2-AC10/B2-AC23 as the
  one web-contract change this ticket makes): npm auto-installs a non-optional peer, which would have
  forced EVERY native consumer to also install `react-dom` — exactly what B2-AC8 forbids. **Web
  consumers must now install `react-dom` themselves**:
  ```
  npm install bobuttons react react-dom
  ```
  `scripts/check-scratch-install.mjs`'s web scratch-consumer scenario was updated to install
  `react-dom` explicitly and still assert the resulting tree is web-only (no unscoped `react-native*`
  package), via a parsed walk of `npm ls --json --all` rather than a raw-text regex (the regex matched
  npm's own `"react-native": {}` placeholder for a *declared-but-absent* peer, which a clean tree with
  no React Native at all would still print — fixing this was necessary, not optional, once
  `react-native` became a peer at all).
- `@tamagui/core` stays a **bundled devDependency** on BOTH platforms (never a `dependencies` or
  `peerDependencies` entry) — Tamagui 3.0.18's native build has zero web dependencies of its own, so
  bundling it native-side costs nothing extra and keeps exactly one `@tamagui/core` instance on the
  native path (B2-AC9).
- `metro`, `@react-native/metro-config` and `react-native` itself are pinned **devDependencies**, used
  only by `check-native-bundle.mjs` to run a real Metro build with no Android SDK/JDK/emulator (see
  below) — `check-dependencies.mjs`'s production-tree assertion still holds because npm marks
  `node_modules/react-native` `dev: true` here.
- No web-only dependency (`react-dom`, `react-native-web`) is present in the native bundle or
  installed in a native consumer's dependency tree; no native-only dependency is mandatory for a web
  consumer. Both are checked mechanically — see below.

### Gate changes (B2-AC10)

B2-AC10 authorises exactly two gate changes; every other existing gate is unchanged. A third,
**strengthening** change was also made and is called out here for the same reason, even though
B2-AC10 only requires enumeration of changes that could weaken a guarantee:

1. **`scripts/check-no-react-native.mjs`** re-scoped to exclude `dist/index.native.js` by exact
   filename (it legitimately imports `react-native`) while still scanning every other shipped web
   file; proven to still bite via `--self-test` (a planted violation in `index.mjs` fails, a clean
   control passes), and proven to scan a non-zero file count.
2. **`scripts/check-scratch-install.mjs`** updated for the `react-dom` optional-peer demotion (decision
   D6): the web scenario now installs `react-dom` explicitly and asserts it as installed, and the
   installed-tree check was rewritten from a raw-text regex to a parsed `npm ls --json --all` walk
   (the regex matched npm's own `"react-native": {}` placeholder for a declared-but-absent peer, so it
   would have failed on a clean tree with no React Native at all once `react-native` became a peer).
3. **`eslint.config.js`**: `@typescript-eslint/no-unused-vars` gained `{ argsIgnorePattern: "^_" }`
   (previously a bare `"error"`), and `bobuttons/no-raw-style-literals` was extended to
   `src/internal/**` and `src/tokens/**` (previously `src/components/**` only). Both are
   **strengthenings or neutral**, not loosenings: `argsIgnorePattern` only permits an unused parameter
   whose name is explicitly prefixed `_` (several native seam halves, e.g. `useCapOffset.native.ts`,
   intentionally ignore an argument the web half uses, to keep both halves' call sites identical), and
   the `no-raw-style-literals` extension closes a reach gap the seam refactor would otherwise have
   opened (moving raw style values into `src/internal/platformStyles*.ts` would have moved them out of
   the rule's reach). Measured against the tree with tests included: zero findings in either new
   directory. `src/provider/**` was deliberately NOT added (3 pre-existing theme-name findings predate
   this ticket) and `bobuttons/no-implicit-intl` was deliberately NOT extended (it would flag
   `formatInstant.ts`/`.native.ts`, the module that rule exists to funnel Intl usage into — see
   `scripts/check-native-audit.mjs`, which enforces that rule's intent there instead).

### Support matrix (B2-AC6)

| | value | source |
|---|---|---|
| Supported React Native range | `>=0.79 <1.0` | decision D2 — 0.79 is the first release whose metro honours package `exports` by default |
| Pinned dev/test React Native version | 0.79.6 | `package.json` devDependency, used by `check-native-bundle.mjs` |
| Android `minSdkVersion` | 24 | `@react-native-community/template@0.79.x/template/android/build.gradle` (read at kickoff research time — this template is NOT a dependency of this repo; no app shell is committed here, see "Scope note" above) |
| Android `compileSdkVersion`/`targetSdkVersion` | 35 | same template, `android/build.gradle` |
| New Architecture (Fabric) | enabled by the 0.79 template default (`newArchEnabled=true`) | same template, `android/gradle.properties` |
| Hermes | enabled by the 0.79 template default (`hermesEnabled=true`) | same template, `android/gradle.properties` |
| iOS | **untested and unsupported** (B2-AC24) | — |
| Intl/ICU | **required**: a consumer must use a React Native/Hermes build with full ICU (decision D8). This library also never crashes if it's missing — see "Dates and numbers" below |

**Rot note on the four template-sourced rows above:** `@react-native-community/template` is
deliberately **not** a dependency of this repo (per the approved scope change — no app shell, no
on-device harness is committed here), so these four values were read once, by hand, at kickoff
research time, against `@react-native-community/template@0.79.x`, and nothing in `npm run verify`
re-reads or re-verifies them. If the supported React Native range (first row) ever moves, these four
rows must be re-read from the new range's matching community-template version by hand before they're
trusted again — there is no automated check to catch them silently going stale.

### Font ownership (B2-AC17)

This library ships **no font assets** on either platform.

- Web: the existing two CSS font stacks (`-apple-system, BlinkMacSystemFont, "SF Pro Display",
  "Segoe UI", sans-serif` for body/heading; `Menlo, Monaco, Consolas, "SF Mono", "Fira Code", monospace`
  for mono), unchanged, in `src/tokens/fontFamilies.ts`.
- Native: React Native's `fontFamily` style takes a **single family name**, not a CSS stack, so
  `src/tokens/fontFamilies.native.ts` declares one Android system face each: `"Roboto"` (body/heading)
  and `"monospace"` (mono's generic alias).
- To get the web's font stack on Android instead of the system faces, a consumer must bundle its own
  font files (e.g. via `react-native.config.js`'s `assets` field or a platform `fonts/` folder) and
  override `bobuttonsConfig`'s font `family` accordingly; this library does not do that for them.
- Fallback when a declared family is absent: whatever React Native's own font-fallback behaviour does
  (platform default sans-serif) — this library declares no custom fallback chain beyond the one name.

### Icons (B2-AC18)

- `griddy-icons` (the web SVG icon set used in stories) **cannot render on native under any peer** —
  its components are DOM `<svg>` elements. There is no version of `griddy-icons`, `react-native-svg`
  or any other peer that makes them work on React Native.
- `Icon`'s public props are unchanged on either platform: `{ source: IconSource; size?: number; color?:
  BobuttonsColorToken; label?: string }`, where `IconSource` is `React.ComponentType<{ size?:
  number | string; color?: string }>`.
- A React Native consumer supplies its **own** icon components of that same shape (e.g. wrapping
  `react-native-vector-icons`, `@expo/vector-icons`, or custom SVG-via-`react-native-svg` components)
  — this library does not ship or require any particular native icon implementation.
- The two glyphs this library draws itself (`CheckGlyph`, used by `Checkbox`; `CloseGlyph`, used by
  `IconButton`'s default) have native-rendering `.native.tsx` halves drawn from plain `View`s (no SVG
  peer needed), since they are internal and not SVG-sourced.

### Insets / safe area (B2-AC19)

Safe-area handling is the **consuming app's responsibility** — no safe-area peer (e.g.
`react-native-safe-area-context`) is declared by this library. `AppShell` exposes one new,
platform-neutral, optional prop for this:

```ts
insets?: { top?: number; bottom?: number; left?: number; right?: number }
```

It defaults to all-zero (so web rendering, and native rendering that doesn't pass it, are unchanged —
the only public-API addition this ticket makes, as called out in the PR) and is applied as padding on
`AppShell`'s outer frame. A React Native consumer typically feeds it
`useSafeAreaInsets()`'s result from `react-native-safe-area-context` (a consumer-side dependency, not
one this library declares). There is no hardcoded Android inset value anywhere in this library.

### Dates and numbers (B2-AC26)

`src/internal/formatInstant.ts` (surfaced by `AppHeader`'s date label) wraps `Intl.DateTimeFormat`/
`Intl.NumberFormat` with a required `locale` and (for dates) `timeZone`. The support matrix above
requires a full-ICU React Native/Hermes build; this library does NOT bundle an ICU polyfill (out of
scope) but also never crashes without one:

- `src/internal/formatInstant.native.ts` catches a construction-time `RangeError` (an unsupported
  locale or time zone) and retries once with the engine's own default locale and no `timeZone`
  override; if even that throws (no `Intl.DateTimeFormat` at all), it falls back to the `Date`'s own
  ISO string rather than throwing at render.
- `formatInstant` has exactly one consumer (`AppHeader`'s date label) and `formatNumber` has none;
  neither is exported from `src/index.ts`. **`AppHeader` drops its date label entirely on the mobile
  breakpoint branch** (see "Responsive behaviour" below) — checking the Intl behaviour by hand
  requires mounting `AppHeader` at a non-mobile width, or the check passes vacuously.
- Any textual difference between the web and native formatted output (locale/ICU data differences,
  not a crash) is either eliminated or recorded as an allowed difference when the owner reviews it by
  hand — otherwise it is a B2-AC16 defect.

### Accessibility (B2-AC20)

`scripts/native-audit.json`'s `accessibilityAudit` array is the enumerated, per-export audit this AC
requires: every one of the 26 public exports (25 components + `BobuttonsProvider`), its `role`/
`aria-*`/`tabIndex` props, and each prop's measured disposition against React Native's actual
supported accessibility surface (`node_modules/react-native/Libraries/Components/View/
ViewAccessibility.d.ts`) — not asserted from the four bullets a summary like this could otherwise get
away with. `scripts/check-native-audit.mjs` (wired into `npm run verify`) fails if any public export
is missing an entry.

- `role` values used anywhere in this library (`"button"`, `"banner"`, `"heading"`, `"tab"`,
  `"tablist"`, `"radio"`, `"radiogroup"`, `"grid"`, `"row"`, `"cell"`, `"img"`) and the `aria-label`/
  `aria-hidden`/`aria-selected`/`aria-checked`/`aria-disabled`/`aria-expanded`/`aria-labelledby` props
  are **all** in RN's supported `Role`/accessibility prop set and are forwarded unchanged — no
  native-only accessibility prop was added to a shared component.
- `tabIndex` is **not inert** on native, but it is mapped two different ways depending on what it's
  attached to: on a `styled(View/Text, ...)` Tamagui component (`Button`, `IconButton`, `Radio`,
  `Tabs`, `ListRow`, `ThemeOption`, `SquareGrid`, `TabBar`'s `TabButton`) Tamagui's own native style
  pipeline maps it to RN's `focusable` prop (`focusable = Number(tabIndex) >= 0`); on `ViewBody` and
  `SettingsLayout` (which pass `tabIndex` through the `Scroll` seam to a bare RN `ScrollView`, not a
  Tamagui component) **`Scroll.native.tsx` forwards it itself** — a bare `ScrollView` is not a Tamagui
  component, so Tamagui's mapping never reaches it (this was a real gap, fixed this pass: see the
  `Scroll.tsx`/`.native.tsx` entry in `scripts/native-audit.json`). Include both mechanisms in the
  by-hand focus-order check on a keyboard-attached Android device or Android TV remote.
- **`aria-level`, `aria-pressed`, `aria-controls` and `aria-orientation` have NO React Native
  equivalent at all** (measured: absent from RN's `ViewAccessibility.d.ts`, and Tamagui's native style
  pipeline has no special case for them either, so each falls through to an unrecognised prop on the
  host component). Used by `AppHeader`/`ViewToolbar`/`SettingsSection` (`aria-level`), `ThemeOption`
  (`aria-pressed`), `CollapsibleSection` (`aria-controls`) and `TabBar`'s mobile tablist
  (`aria-orientation`) — each is named in `accessibilityAudit` as `inert-no-rn-equivalent` and is an
  item for the owner's manual on-device B2-AC2 check (confirm no console warning; no automated check
  can confirm this without the device harness this ticket's approved scope explicitly excludes).
- Touch-target rule: where Android's ~48dp accessibility minimum would exceed a control's existing
  web pointer-sized box, the fix is to enlarge the **hit area only** (press padding / `hitSlop`),
  never the painted box — web pixel sizes are non-negotiable (B2-AC11). One shared helper,
  `touchHitSlop(paintedWidth?, paintedHeight?)` in `src/internal/platformStyles.native.ts`, computes
  the `Insets` needed to reach 48dp on whichever axis a control's painted size falls short (an axis
  passed as `undefined`, because it is already content-driven and adequate — e.g. a full-width row —
  is left at 0); `platformStyles.ts`'s web half is a no-op returning `undefined`, so the prop is never
  even set on web. A later review pass (round 3 follow-up) found this applied in only one place and
  one site provably broken, and completed it for every interactive control the audit found short of
  48dp:
  - `Tabs`' `Tab` (29dp tall, width not grown — tabs sit only 2px apart), `CollapsibleSection`'s
    `Header` (the element that actually carries `onPress` on native; its `Toggle` child does not —
    45dp tall), `TabBar`'s `TabButton` (44–46dp tall depending on layout; width already clears 48dp in
    both), and `SquareGrid`'s pressable squares (grown from their own actual, not estimated, painted
    size — the default 40dp squareSize plus the grid's 4px gap lands exactly on 48dp with no overlap
    into a neighbouring square; a much smaller custom `squareSize` could make adjacent squares' hit
    areas overlap, a tile-size choice for the consumer) — all unchanged from the first pass.
  - `IconButton` (24×16dp, unchanged): a later review pass (round 4, finding 1) found this control's
    `hitSlop` was silently INERT — its host, `Frame`, was a `styled(Text, ...)` (`isText`), and
    Android only honours hit-area growth on views implementing `ReactHitSlopView`
    (`ReactViewGroup`; `react-native`'s `Text` has no `hitSlop` prop at all), so the Insets computed
    by `touchHitSlop(24, 16)` were accepted by the prop type but never dispatched. Fixed by moving
    `Frame`'s definition out of `IconButton.tsx` and into the EXISTING `src/internal/platformStyles
    .ts`/`.native.tsx` seam, under the same exported name, instead of a new dedicated seam file (that
    would have added a new module boundary to the web bundle for no web-visible benefit): the web
    half is byte-for-byte what the old local `Frame` was (B2-AC11, see the fifth dist-size raise
    above for the measured gzip-only delta); the native half is a `styled(View, ...)` press target
    (owns `onPress`/`hitSlop`/accessibility — painted box unchanged) wrapping an inner
    `styled(Text, ...)` only so a raw string `children` (the `CustomGlyph` story's `"+"`) still
    renders legally on native. Effective touch target: 24×16dp -> 48×48dp (`touchHitSlop(24, 16)` ->
    12dp left/right, 16dp top/bottom).
  - `Button` (35dp tall -> 49dp), `TabBar`'s two scroll arrows (28dp wide -> 48dp; height already
    spans the bar), `ListRow`'s radio control (20×20dp -> 48×48dp) and `Radio`'s title-only card
    (46dp tall -> 48dp) — newly grown, this pass.
  - `TextField.native.tsx`'s checkbox `Pressable` (14dp box): its own `hitSlop={8}` (30dp) was
    corrected to `hitSlop={touchHitSlop(14, 14)}`, but that **still cannot reach 48dp**, because
    Android's touch dispatch (ReactAndroid's `TouchTargetHelper`) rejects a touch point outside a
    PARENT view's own bounds before it ever reaches the child, and this Pressable's immediate
    ancestor chain (a 14×14 `Box` inside an 8.52px-tall `Slot`) is itself far smaller than 48dp. The
    actual fix grows `Checkbox.tsx`'s `Row` instead (17dp tall -> 49dp) — the ancestor that has room
    and already carries its own `onPress` — so the Pressable's own `hitSlop` is kept only as
    harmless, non-load-bearing best-effort coverage.

  For `Button` and `Radio` (which already call `useInteractive`/`useButtonInteraction`), the growth
  is threaded through the SAME `handlers` object every caller already spreads — a new optional
  `HitSlopSize` argument to those hooks that `interaction.ts` (web) ignores and only
  `interaction.native.ts` turns into a `hitSlop` key — so neither adds a `hitSlop` prop line to the
  shared component source, keeping their share of this pass's web-bundle growth at zero. `ListRow`'s
  radio View, `TabBar`'s two `Arrow` views and `Checkbox`'s `Row` have no existing `handlers` object
  to piggyback on and each still needs its own `hitSlop={touchHitSlop(...)}` line (see the fourth
  dist-size raise above).

  If a painted box ever has to change to meet the minimum, that is recorded as an allowed difference
  when the owner reviews parity by hand, not silently done. No painted box changed in this work.

### Responsive behaviour (B2-AC28)

The breakpoints (`src/tokens/breakpoints.ts`: `tablet` maxWidth 1023, `mobile` maxWidth 599) are
**unchanged** desktop-first max-widths — this ticket documents and honours them, it does not redesign
them. Because they are desktop-first, **every Android phone in portrait falls into the `mobile`
branch**: `AppShell` stacks its sidebar above the content, `TabBar` becomes a horizontally-scrolling
icon bar, `AppHeader` drops its date label, and `useContentInset` returns `$4`. This is the layout
*least* exercised by the existing desktop-oriented web stories, so it is the first thing to check by
hand on a real device.

`TabBar`'s horizontal mode on native uses a real `ScrollView` (`src/internal/Scroll.native.tsx`) with
`onLayout`/`onContentSizeChange`/`onScroll`, so rotation, split-screen/multi-window and
soft-keyboard-driven resize all re-measure through the same React Native layout events a real device
delivers — there is no separate "remeasure on rotate" code path to go stale. Check by hand that
rotating the device (or resizing a split-screen window) does not freeze the layout or remount
`TabBar`.

### Complete divergence list (B2-AC5)

This is the full, maintained list of behavioural differences between web and native. Anything NOT
listed here is a defect, not an accepted divergence.

1. **Pointer hover is inert on native and is never emulated by press.** Every component that shows a
   hover visual (`TabBar`'s tabs, `Radio`, `IconButton`, `Tabs`, `CollapsibleSection`, `ThemeOption`,
   `SquareGrid`'s hover squares) derives its highlighted state from `hovered || pressed`
   (`src/internal/interaction.ts`'s `useInteractive`); on native, `hovered` is permanently `false`, so
   the SAME visual is still reachable, via a held press, satisfying "every visual interaction state
   reachable on web stays reachable on native."
2. **Keyboard activation (Enter/Space) is inert on native.** `activationKeyHandlers` returns `{}` on
   native (`src/internal/interaction.native.ts`) — there is no keyboard to attach it to on a typical
   Android touch device.
3. **Web-only props that remain on the shared type surface but are inert on native:** no component
   forwards an open-ended `...rest` of DOM-ish props (every public props interface is hand-written and
   enumerated), so the only entries are the ones named explicitly elsewhere in this list plus the
   following, all from the B2-AC20 per-export accessibility audit
   (`scripts/native-audit.json`'s `accessibilityAudit`, `inert-no-rn-equivalent`): `AppHeader`'s,
   `ViewToolbar`'s and `SettingsSection`'s `aria-level` (RN has no heading-depth concept), `ThemeOption`'s
   `aria-pressed` (RN's closest prop, `AccessibilityState.selected`, is not wired to it), `CollapsibleSection`'s
   `aria-controls` (no RN cross-reference mechanism), `TabBar`'s mobile-tablist `aria-orientation` (no RN
   prop at all), and `TextInput`'s `min`/`max` (item 4 below, no RN `TextInput` equivalent). If a future
   change adds another inert web-only prop, list it here by name.
4. **Android IME / text-input capabilities** (`TextInput`'s `type` prop, via
   `src/internal/TextField.native.tsx`):
   - `autoCorrect` — applied as a documented native default (`false`), not exposed as a prop.
   - `autoCapitalize` — applied as a documented native default (`"none"`), not exposed as a prop.
   - `keyboardType` — reachable through the existing `type` prop (`"email"` → `email-address`,
     `"url"` → `url`, `"number"` → `numeric`, else default).
   - `secureTextEntry` — reachable through `type="password"`.
   - `multiline` — **declared not supported** by this ticket; `TextInput` has no multiline mode on
     either platform.
   - Return-key behaviour — `onEnter` maps to `onSubmitEditing` with `returnKeyType="done"`.
   - `min`/`max` (HTML number-input bounds) — inert on native; `TextField.native.tsx` does not apply
     them (no RN `TextInput` equivalent).
5. **Gradient surfaces use a flat-colour fallback on native (decision D4),** not RN 0.79's experimental
   `experimental_backgroundImage` and not a `react-native-linear-gradient`/masked-view peer:
   - `AppHeader`'s gradient title → flat `$primary` text colour.
   - `ViewPane`'s / `SettingsSection`'s top stripe → solid `$accent` fill.
   - `TabBar`'s two scroll-edge fades → a flat, reduced-opacity strip in the resolved frame-background
     colour, instead of a fade to transparent.
6. **`SquareGrid`'s raised-edge darkening is an RGB approximation on native,** not true OKLCh relative-
   colour arithmetic (`src/internal/tileDepth.native.ts`) — computing the darker colour in JS
   identically on both platforms was rejected specifically because it would change the WEB pixels,
   since JS RGB arithmetic is not the browser's OKLCh. Any visible difference is reviewed by hand.
7. **`SquareGrid`'s drop shadow uses RN's native `shadow*`/`elevationAndroid` props on native,**
   rather than the web's CSS `box-shadow` with a `color-mix()` colour — RN 0.79 ships real shadow
   support, so this is a reasonable approximation, reviewed by hand rather than asserted pixel-exact.
8. **`Checkbox`'s and `Radio`'s `alignItems: "baseline"` may align text differently on native than on
   a browser** — Yoga's (React Native's layout engine) text-baseline computation need not land on the
   same pixel as a browser's. This was treated as a seam requirement in earlier drafts of this ticket;
   measured, RN's `FlexAlignType` includes `'baseline'`, so no seam is needed — this is purely a
   visual-parity item to check by hand, not a behavioural gap.
9. **`Checkbox`'s check glyph and `IconButton`'s default close glyph are drawn from plain `View`s on
   native**, not an inline SVG (`src/internal/CheckGlyph.native.tsx`,
   `src/internal/CloseGlyph.native.tsx`) — a reasonable visual approximation, not pixel-identical to
   the web SVG paths.
10. **`TessellatedBackground`'s repeating pattern is explicitly tiled across a measured area on
    native**, not a single CSS `<pattern>` the browser repeats for free
    (`src/internal/TessellatedPattern.native.tsx`). It renders nothing until its first `onLayout`
    (B2-AC13 first frame: no flash of a wrongly-sized guess), then the full tiled pattern. This can
    render meaningfully more `View`s than the web approach costs DOM nodes for a densely-tiled, large
    area — acceptable for this component's documented intended use (3-8 icons, 1-3 copies each) but
    worth knowing if a consumer tiles something much larger.
11. **`TabBar`'s "scroll the selected tab into view" is an approximation on native**
    (`src/internal/Scroll.native.tsx`): it tracks each tab's x-position via `onLayout` and scrolls just
    far enough to bring it fully into the visible range, which is the same user-facing behaviour as
    the web's `scrollIntoView({ block: "nearest" })` but implemented independently (there is no
    equivalent native API) rather than being provably identical in every edge case.
12. **Date/number formatting** — see "Dates and numbers" above.
13. **`AppHeader` drops its date label on the mobile breakpoint** — identical behaviour on both
    platforms (this is existing, unchanged web behaviour, listed here only because it interacts with
    item 12 above and with B2-AC28).
14. **`Checkbox`'s focus ring treats every native focus as `:focus-visible`.** On web, `focusVisible`
    only turns on when the browser's own `:focus-visible` heuristic matches (keyboard focus, not a
    mouse click); `TextField.native.tsx` always reports `visible: true` on `onFocus`, because React
    Native has no mouse-vs-keyboard focus distinction to mirror it with. A focused checkbox on native
    therefore always shows the ring a web keyboard user would see.
15. **`Button`'s focus-ring state is effectively unreachable on native under touch.** `useButtonInteraction`
    derives the same press-beats-hover-beats-focus precedence on both platforms (`src/internal/
    interaction.ts`/`.native.ts`), but React Native only fires `onFocus` from a hardware keyboard or a
    TV/D-pad remote — a touch tap goes straight through `onPressIn`/`onPressOut` and never focuses the
    view in the way `onFocus` observes. The "focus" visual therefore exists on native only for the
    keyboard/remote-attached case named in the `tabIndex`→`focusable` item above, not for a plain touch
    tap; "press" and "hover" (via held press) stay reachable exactly as described in items 1-2.

### What `check-native-bundle.mjs` proves (no Android SDK/JDK/emulator/device required)

Run as part of `npm run verify` (after `build` and `pack`) or standalone via `npm run verify:native`:

1. `dist/index.native.js` imports ONLY `react`, `react/jsx-runtime` and `react-native` as bare
   specifiers (B2-AC7).
2. A **real Metro build** (`platform="android"`, via `metro`'s and `@react-native/metro-config`'s own
   programmatic API) over the **packed tarball**, from a minimal entry file written into a temp
   directory at runtime and deleted afterwards (no committed harness or overlay) — proves Metro's
   dependency graph resolves `bobuttons` to `dist/index.native.js` and reaches neither
   `dist/index.mjs` nor `dist/index.cjs`, and contains no `react-dom`/`react-native-web` module
   (B2-AC8). B2-AC9's "exactly one `@tamagui/core` instance" is checked differently: because
   `dist/index.native.js` is already a pre-bundled artifact (tsup inlined `@tamagui/core` at build
   time), Metro never resolves a *separate* `@tamagui/core` module for it — bobuttons is one opaque
   module to Metro. The check instead counts esbuild's preserved `// <path>` banner comment naming
   Tamagui's native runtime entry point INSIDE that one pre-bundled file, as it appears verbatim in
   Metro's output, which is a build-time duplication check (did tsup inline it more than once?), not a
   Metro-graph module count. The temp
   project is created INSIDE the repo (under the already-gitignored `.verify-out/`), not under the OS
   temp directory, specifically so Node's/Metro's own ancestor-directory `node_modules` resolution
   reaches this repo's own `node_modules` — this is what lets the check run without installing a
   second `node_modules` tree or editing `.github/workflows/verify.yml`.
3. The B2-AC12 token scan of `dist/index.native.js`, for `var(--`, `linear-gradient(`, `color-mix(`,
   `oklch(`, `::placeholder`, `::-webkit-`, `data-bobuttons`, `document.`, `100vh`, `inline-flex`,
   `not-allowed` and `currentColor` (the CSS keyword has no native equivalent — see `SquareGrid`'s
   `scripts/native-audit.json` entry). The scan is scoped to the bundled modules whose esbuild-preserved `// <path>` banner
   comment starts with `src/` (Bobuttons' own code) — **measured finding**: scanning the whole,
   unscoped bundle is unsatisfiable as originally specified, because `@tamagui/core`'s own
   NATIVE-targeted vendor files (e.g. `@tamagui/web`'s `createVariable.native.js`) still contain some
   of these substrings inside an `isWeb`-guarded branch that is dead code at runtime but is not
   stripped from the shipped file. Those are not reachable from Bobuttons' own source and are not
   ours to fix; the scoped scan on Bobuttons' own modules is currently clean (0 of 12 tokens).
4. The native consumer typecheck pair (`moduleResolution: "bundler"` and `"node16"`, each with
   `customConditions: ["react-native"]`) over the packed tarball, proving B2-AC4's "one shared
   declaration emit referenced by every export condition" on the shipped artifact.

### Fresh DOM/CSS audit (B2-AC29)

`scripts/native-audit.json` is a fresh, in-repo, file:line-keyed enumeration of every DOM/CSS/browser-
only construct found on the shared path during this ticket's implementation, each with its named
native substitute and a measured disposition (`handled-by-tamagui` / `silently-dropped` /
`invalid-needs-seam` / `visually-wrong-needs-seam`). `scripts/check-native-audit.mjs` (wired into
`npm run verify`) keeps its schema honest and separately enforces `bobuttons/no-implicit-intl`'s
*intent* on `formatInstant.ts`/`formatInstant.native.ts` (the rule itself is scoped to
`src/components/**` and cannot reach the module it exists to funnel Intl usage into). The audit
corrected several assumptions this ticket's own TaskSpec made before any source was read — most
notably that `display: "inline-flex"`'s naive substitute, `display: "flex"`, would have **stretched
six controls to their parent's full width** on Android (React Native's own default `display` is
already `"flex"`); the correct substitute, `alignSelf: "flex-start"`, is what's shipped
(`src/internal/platformStyles.native.ts`).

### Theming (B2-AC14, B2-AC15)

The theme, token and palette pipeline (`src/themes/themes.source.css` →
`scripts/generate-themes.mjs` → `src/themes/themes.generated.ts` → `src/tamagui.config.ts`) was
already platform-neutral before this ticket (no `.css` import anywhere under `src/`) —
`scripts/check-themes.mjs` now also asserts that invariant directly, so a second, native-only token
or theme path cannot appear later. `BobuttonsProvider.native.tsx` uses the exact same
`defaultTheme`-is-live mechanism as the web provider (no inner `<Theme>`, no `key` — see
`BobuttonsProvider.remount.test.tsx`'s comment); this is INHERITED from `@tamagui/core`'s native
runtime holding the same behaviour on a different file set, not proven by a dedicated automated test
in this repo, so it is one of the things the owner checks by hand (mount-count across every theme) in
the scratch app before sign-off.

### Visual parity (B2-AC16)

Per the kickoff decision (D3), parity review is **informal**: the library owner reviews every
component side by side (web vs. the scratch Android app) across the theme list, by hand, rather than
through a committed `scripts/native-parity.json` artifact. Accepted/expected rendering differences are
the ones enumerated in "Complete divergence list" above (items 6, 7, 8, 9, 10, 11 are specifically
visual); anything else observed during that review is either fixed or added to that list. The story
set the owner should review against includes at least one component per inventory category, every
theme, and specifically the **mobile** web layout (see "Responsive behaviour" above) as the closest
point of comparison for an Android phone in portrait.
