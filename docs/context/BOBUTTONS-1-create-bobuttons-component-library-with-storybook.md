# BOBUTTONS-1 — Create Bobuttons component library with Storybook

> Architect context file. **Revision 5** — answers the twelve review concerns raised against revision 4.
> Six were answered by running code against the real `@tamagui/core@3.0.18`, `griddy-icons@0.2.0` and npm 10.9.3;
> **one high-rated concern turned out to be factually wrong** (§N1), and the investigation surfaced
> **two new findings of its own** (§F6 HIGH, §F7 MEDIUM) that no AC and no reviewer had named.
> Durable location: keep this file in `docs/context/`. Revisions 3 and 4 stand unless noted here.

## Status

**Product scope is unblocked. Architecture is DECIDED: Tamagui.** Delivery is three slices (AC21).
Everything marked **VERIFIED** was measured in a pass with the commands or probes shown, not inferred.

## Domain and key files

Domain: frontend design system — a private React (Tamagui) component library with Storybook as the review
and design surface. No database, no migrations, no multi-tenancy, no N+1 surface. The blast radius is the
**public API surface** and the **semantic token names**, both consumed by three future consumers.

Repo state (verified): git repo, remote `github.com/IvaStevens/Bobuttons.git`, on branch
`BOBUTTONS-1-create-bobuttons-component-library-with-storybook`, one commit (`9a6a336`), tracked content is
`README.md` (one line) only; `docs/` is untracked. No `package.json`, `.gitignore`, lockfile, CI or tests.
Toolchain: Node v22.20.0, npm 10.9.3, npm cache at `~/.npm`, network reachable.

Key files are as listed in the TaskSpec. Everything under `oncall-navigator-app/` and `DailyTracker/` is
read-only reference material designated by the ticket; see §Disclosure.

---

## A. Verified source-of-truth data (AC4, AC5, AC6, AC8)

### A1. Theme block counts — ticket is correct
Parsed `oncall-navigator-app/src/styles/themes.css` (219 lines, 8042 bytes) with a CSS block parser:

```
:root     -> 27 vars
ocean     -> 17   terminal -> 17   coastal -> 17   dusk -> 17
velvet    -> 17   jade     -> 17   jade-aa -> 17   grove -> 26
```

Flattening (`:root` first, then the theme's own declarations) yields **9 themes with an identical 27-key set**.
The seven 17-var themes each inherit exactly the 10 vars AC4 names, in that order:
`--radius --sentry-color --jira-color --status-new --status-invest --status-done --status-supp --sla-green --sla-amber --sla-red`.
`grove` inherits exactly one: `--radius`. **AC4 is reproduced byte-for-byte.** Zero new colours.

27 vars − `--radius` (config token per AC7) = **26 colour tokens**, + 8 derived (A3) = **34 keys per theme**.
AC5's arithmetic holds.

**VERIFIED, new in rev 5 — the complete selector list of `themes.css` is exactly 13 selectors:**
`:root`, eight `[data-theme="<id>"]` blocks, and four `[data-theme="grove"] .status-*` rules. AC3's test
("`themeNames` equals the set of `[data-theme=…]` blocks plus `default`") therefore **must anchor on the whole
selector string** — a loose `[data-theme="(\w+)"]` match counts `grove` five times and the test passes for the
wrong reason. Parser contract: a theme block is a selector matching `^\[data-theme="([a-z-]+)"\]$` **and
nothing else**; anything with a descendant part is a status rule and belongs to §A3.

**VERIFIED, new in rev 5 — `--radius: 12px` is declared exactly once, at `themes.css:25`, inside `:root`.**
No theme overrides it. AC7's claim that it is a config-level token, not a theme token, is correct.

### A2. DailyTracker contributes nothing — ticket is correct
`DailyTracker/src/styles/global.css` declares `:root` (18 vars) and `ocean`/`terminal`/`coastal` (17 each).
Diffed against `themes.css`: **0 value differences, 0 variables absent from `themes.css`**. It is a strict
subset. Record this in `docs/api/token-mapping.md` and take nothing from it (AC8).

### A3. Status surfaces — ticket is correct and now fully derivable
Base rules, `queue.css:208-211`:
```
.status-new           border 1px rgba(251,66,38,0.4)    background rgba(251,66,38,0.12)
.status-investigating border 1px rgba(246,201,14,0.4)   background rgba(246,201,14,0.12)
.status-investigated  border 1px rgba(74,222,128,0.4)   background rgba(74,222,128,0.12)
.status-suppressed    border 1px rgba(168,149,208,0.3)  background rgba(168,149,208,0.08)
```
Those four rgba triplets are exactly the `:root` values of `--status-new #fb4226`, `--status-invest #f6c90e`,
`--status-done #4ade80`, `--status-supp #a895d0`. Because the seven non-grove themes **inherit** the `:root`
status colours unchanged (A1), deriving each theme's surface from *its own* status token at the AC6 alphas
reproduces today's rendering exactly for all eight non-grove themes.

Grove overrides, `themes.css:216-219`, use 0.08/0.30 for all four, and their rgba triplets are exactly grove's
own `--status-new #b91c1c`, `--status-invest #6e5500`, `--status-done #166534`, `--status-supp #5b4d89`.
**AC6's rule is a faithful restatement of the file. No colour is invented.**

Note the source files are textually inconsistent about alpha precision: `queue.css` writes `0.4` / `0.3`,
`themes.css` grove writes `0.30`. Numerically identical. §N6 pins one emit format for the generated tokens.

### A4. Semantic token mapping (AC5) — the Architect's naming, fixed here
`--teal -> primary`, `--pink -> secondary`, `--lavender -> accent` are fixed by AC5. The remaining 23 are named
below. Where a Tamagui conventional key exists (`background`, `color`, `borderColor`) it is used, so `styled()`
picks the value up automatically instead of every component re-plumbing it.

| CSS var | token | | CSS var | token |
|---|---|---|---|---|
| `--bg` | `background` | | `--text` | `color` |
| `--surface` | `surface` | | `--text-dim` | `textDim` |
| `--surface-2` | `surface2` | | `--text-faint` | `textFaint` |
| `--surface-3` | `surface3` | | `--border` | `borderColor` |
| `--frame-bg` | `frameBackground` | | `--sentry-color` | `sentry` |
| `--teal` | `primary` *(fixed)* | | `--jira-color` | `jira` |
| `--teal-dim` | `primaryDim` | | `--status-new` | `statusNew` |
| `--teal-glow` | `primaryGlow` | | `--status-invest` | `statusInvestigating` |
| `--pink` | `secondary` *(fixed)* | | `--status-done` | `statusInvestigated` |
| `--pink-dim` | `secondaryDim` | | `--status-supp` | `statusSuppressed` |
| `--pink-glow` | `secondaryGlow` | | `--sla-green` | `slaGreen` |
| `--lavender` | `accent` *(fixed)* | | `--sla-amber` | `slaAmber` |
| `--lavender-dim` | `accentDim` | | `--sla-red` | `slaRed` |

26 above + 8 derived (`statusNewBg`/`statusNewBorder`, `statusInvestigatingBg`/`Border`,
`statusInvestigatedBg`/`Border`, `statusSuppressedBg`/`Border`) = **34**. This table is the content of
`docs/api/token-mapping.md`; renaming any entry later is a breaking change across three consumers.

### A5. Non-colour scales (AC7) — measured
- **Body font** (`shell.css:9`, exact match to AC7): `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif`.
- **Mono font**: AC7's string is a *synthesis*, not a copy — see §F3.
- **z-index**: measured across both apps, the complete set is `1` (×3), `20` (×1), `1000` (×1). `1000` is the
  meeting-alert overlay, as AC7 says.
- **Font weights**: measured `300, 400, 450, 500, 600, 700, 800`.
- **Font sizes**: see §F2 — AC7's stated range is too narrow.

### A6. Value shapes in `themes.css` — **VERIFIED, new in rev 5, load-bearing for the generator**
172 custom-property declarations in total: **117 six-digit hex, 54 `rgba(...)`, one `12px`** (`--radius`).
No three-digit hex, no `rgb()`, no named colours, no `var()` indirection.
- Six variables are **always** `rgba(...)`, never hex: `--border`, `--teal-dim`, `--teal-glow`, `--pink-dim`,
  `--pink-glow`, `--lavender-dim`. No variable mixes shapes across themes.
- **Seven declarations use uppercase hex** — `--bg #0D1B2A`, `--surface-2 #1A2E44`, `--teal #29ACEA`,
  `--pink #F5A623`, `--lavender #5E9ED6`, `--text #E4EEF8`, `--text-dim #7FA3CA` (all in `coastal`).
- The four `--status-*` variables are six-digit hex in **every** theme, so AC6's hex→rgb derivation is total
  and needs no fallback.

Consequence (§N6): the generator **copies declaration values verbatim** and normalises nothing.

---

## B. Verified dependency facts (AC11, AC12, AC15, AC20)

| Package | Latest | Decision |
|---|---|---|
| `@tamagui/core` | **3.0.18** | pin exact, **`devDependencies` only** — see §F6. Peer is `react: >=19` only. |
| `storybook`, `@storybook/react-vite`, `@storybook/addon-a11y` | **10.6.2** | pin exact, lockstep. |
| `@storybook/addon-vitest` | 10.6.2 | AC16 runner — see §C3. |
| `vitest`, `@vitest/browser` | 5.0.5 | with `@vitest/browser-playwright`. |
| `vite` | **8.3.4** | pin exact. Satisfies `@storybook/react-vite` peer `^5\|\|^6\|\|^7\|\|^8` **and** `@tamagui/vite-plugin` peer `^8.0.3`. Both source apps already run `vite ^8.0.11`. |
| `typescript` | 7.0.2 published | **pin 6.0.3, not 7** — see §F4. |
| `eslint` / `typescript-eslint` | 10.13.0 / 8.72.0 | compatible pair. |
| `react` / `react-dom` | 19.3.1 | `peerDependencies: ">=19"`; scratch consumer pre-seeded at 19.3.1. |
| `griddy-icons` | 0.2.0 | **story-only `devDependencies`** — see §N2. No deps, peer `react >=16.8.0`. |

### B1. Tamagui ships CJS — the AC15 CJS risk is real but tractable
`@tamagui/core@3.0.18` is `"type": "module"` but its `exports` map declares a `require` condition
(`./dist/cjs/index.cjs`) on every subpath. A CJS build is therefore achievable, **provided the bundler resolves
the `require` condition when emitting `.cjs`**. tsup/esbuild do this per output format by default.

### B2. The react-native risk is confined to `.native.*` files
`@tamagui/web`, `@tamagui/constants` and `@tamagui/react-native-media-driver` **do** contain
`from "react-native"` / `require("react-native")` — but **only** in files named `*.native.js` / `*.native.cjs`,
reached solely through the `react-native` export condition (present on every Tamagui subpath) or Metro's
`.native.js` extension resolution. **Hard constraint for the build config: never add `react-native` to
`resolve.conditions` and never add `.native.js` to resolved extensions.** Default web bundler behaviour is safe.

Empirically confirmed: bundling `@tamagui/core@3.0.18` with esbuild (`--format=esm --platform=browser`,
react/react-dom external) produced **335,947 B raw / 81,907 B gzip** with **zero** occurrences of the substring
`react-native` anywhere in the output. That is also a realistic **AC19 budget floor** — the spike's independent
319.9 kB / 80.6 kB agrees to within 5%.

### B3. AC12 scan must match specifiers, not substrings
`@tamagui/react-native-media-driver` is a *scoped* package whose **name** contains `react-native`. A substring
grep is one bundler-comment or one banner away from a false positive, and `npm ls` output contains the name
verbatim. Specify both checks by shape:
- **(a) dist scan**: match only bare specifiers — `from`/`require(`/bare `import` of exactly `react-native` or
  `react-native-web`, optionally with a `/subpath`. Scope: `dist/**/*.{js,mjs,cjs,d.ts,d.cts}`. Source maps and
  the Storybook build are out of scope (AC12 says so).
- **(b) tree scan**: read `npm ls --json --all` in the scratch consumer and fail on any **unscoped** package
  name matching `^react-native(-|$)`. Scoped `@tamagui/react-native-*` is not a react-native package and must
  not trip the check. With `@tamagui/*` bundled into `dist` **and kept out of `dependencies`** (§F6), nothing
  Tamagui is installed in the consumer at all.

---

## C. Architecture decisions (revision 3/4 decisions, confirmed or sharpened)

### C1. Public type surface must not reference `@tamagui/*` — load-bearing (see §F1)
Every exported component is declared with a **hand-written props interface and an explicit
`React.ReactElement` return annotation**; `styled()` results stay module-private and are never exported or
inferred into a public signature. `bobuttonsConfig` is exported through an explicit opaque type.
Verified: with explicit annotations the emitted `.d.ts` contains **zero** `@tamagui` references; without them
it emits `import { … } from '@tamagui/core'` and the AC15 scratch consumer fails with TS2307.

### C2. Build and module format
`tsc --emitDeclarationOnly` for declarations (then copy `.d.ts` -> `.d.cts`), tsup/esbuild for ESM + CJS JS.
`exports` conditions ordered `types`, `import`, `require`, `default`. Declaring a `require` condition without
emitting the `.cjs` fails CJS consumers with TS1479 under `node16` while passing under `bundler` — hence AC18's
dual typecheck. `sideEffects`: start at `["*.css"]`, not `false`; `@tamagui/core` itself declares
`sideEffects: ["*.css", "**/runtime.*"]`, and a blanket `false` risks a tree-shaker dropping the runtime
registration. Promote to `false` only if the Slice 1 tree-shaking check stays green.

### C3. Storybook and the AC16 gate
Storybook 10.6.2 + `@storybook/react-vite` + `@storybook/addon-a11y`, with a decorator wrapping every story in
`BobuttonsProvider` driven by a `globalTypes` theme toolbar. For the mechanical gate prefer
`@storybook/addon-vitest` (Storybook 10's native path: stories run as Vitest browser tests, a11y assertions come
from the a11y addon) over `@storybook/test-runner`; both need Playwright, so CI must run
`npx playwright install --with-deps chromium`. AC16 needs **two** runs with different globals and rule sets:
`default` theme with `color-contrast` disabled, `jade-aa` with `color-contrast` enabled. Model them as two
Vitest projects differing only in `initialGlobals` and `a11y` parameters.

### C4. Provider, bundling, peers, publish defence, determinism
Unchanged from revision 3/4: bundle `@tamagui/*` into `dist`; `react`/`react-dom` as peers `>=19`;
`private: true` **plus** a non-zero `prepublishOnly` and a *static* `private === true` assert;
`prepack: npm run build`; `now` injected as a prop defaulting to `Date.now`.
`data-theme` mirroring stays **off** (ticket default; nothing in the library needs it).
Icons: **props-first, decided in full in §N2.**

---

## D. Shared components — verified prop reality (AC13)

All five exist in both apps. All four conflicts AC13 names are confirmed verbatim:

- **`AppHeader`** takes **no props at all** in either app. Title is a string literal (`'On-Call Navigator'` /
  `'Daily Tracker'`) and the date is computed with `new Date().toLocaleDateString('en-US', …)` — at **module
  scope** in oncall (`AppHeader.tsx:3`, so it freezes at import) and in render in DailyTracker.
- **`CollapsibleSection`**: oncall `{ label, colorClass?, count?, children, defaultOpen = true, headerAction? }`;
  DailyTracker `{ label, colorClass (required), defaultCollapsed = false, children }`. Both default to *open*,
  so the inverted flags agree semantically; `count` and `headerAction` are oncall-only and join the superset.
- **`TabBar`**: oncall `{ current, onChange, visibleTabs: Set<TabId> }` + a module-level `PINNED_TABS`;
  DailyTracker `{ current, onChange }`. Both hardcode their tab array, their `TabId` import and `griddy-icons`,
  and both render `react-bootstrap/Nav`. Full merged contract in §N3.

Two things AC13 does not resolve, resolved here:

1. **`colorClass` is a CSS class name, not a colour.** It cannot pass through into a Tamagui component as
   styling. Keep `colorClass?: string` as an accepted, documented-deprecated passthrough (optional, so both
   apps' call shapes still typecheck) and add `accentToken?: BobuttonsColorToken` as the real API. A class name
   is not a colour literal, so this does not breach AC7's lint rule.
2. **"accepts both source apps' existing call shapes" cannot mean literal JSX reuse.** AC13 also forbids
   hardcoded titles and app-local tab arrays, so merged `AppHeader` gains a **required** `title` and merged
   `TabBar` a **required** `tabs` — neither is present in today's JSX, so the old call sites cannot compile
   unchanged. Read the type test as: *every prop each app passes today is assignable to the merged prop of the
   same name, with the generic id type instantiated at that app's `TabId`.* Write the test that way, or it is
   unsatisfiable.

---

## E. Determinism (AC17) — the exact blast radius

`Math.random` appears **nowhere** in either app's `src/`. `new Date()` / `Date.now()` appear in **12**
components, which is precisely the set that needs the injected `now` prop:
`SlaTimer`, `AppHeader`, `WorkflowPanel`, `BugDetailPane`, `MeetingAlert`, `ReviewPanel` (via its views) and the
views `Queue`, `Activity`, `Today`, `Calendar`, `Notes`, `Github`.

**VERIFIED, new in rev 5:** across both apps' `src/` there are **32 `toLocale*` / `new Intl.` calls and
*zero* of them pass a `timeZone`**. Several pass `[]` (system locale) rather than an explicit one —
`GithubView.tsx:6-7` is the clearest case. `BugDetailPane.tsx:141-145` holds four fully bare
`toLocaleString()` calls. See §N4 for the mechanism.

---

## F. Findings that change the plan

### F1. [HIGH] The emitted `.d.ts` leaks `@tamagui/core` and breaks AC15 — not named by any AC
Reproduced: a module re-exporting Tamagui symbols emits
`import { createTamagui, TamaguiProvider, styled, View, Text } from '@tamagui/core';` into `index.d.ts`.
The AC15 scratch consumer installs **only** `react`, `react-dom` and the tarball, so that import resolves to
nothing and typecheck fails with **TS2307 under both `bundler` and `node16`** — passing every other gate first.
Mitigation: §C1, plus `scripts/check-dts-encapsulation.mjs`.

### F2. [MEDIUM] AC7's font-size range is too narrow to build the inventory
AC7 says "roughly 9px to 22px, including the fractional 12.5/13.5px". Measured across both apps the real set is
**8, 9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 36 px** — 18 steps, with **four**
fractional values, not two. Both endpoints are load-bearing for inventory components: **8px** is
`.status-badge` (`queue.css:201`) -> `StatusBadge`, and **36px** is `.empty-icon` (`global.css:427`) ->
`EmptyState`. Since AC7 forbids raw px outside `src/tamagui.config.ts`, a 9–22 scale makes those two components
unbuildable. Resolution (inside AC7's own "covering the sizes used by the source apps"): ship the measured
18-step scale. Not scope creep; AC7's parenthetical is explicitly approximate.

### F3. [LOW] AC7's mono font stack is a merge of two declarations, not a transcription
No single declaration in either app contains AC7's string; it merges `global.css:2433`
(`'Menlo','Monaco','Consolas', monospace`) and `global.css:2535` (`'SF Mono','Fira Code', monospace`), plus bare
`monospace` in oncall. AC7 fixes the merged string, so implement AC7's string — the provenance is recorded so a
later reader does not hunt for a source line that does not exist.

### F4. [MEDIUM] TypeScript must be pinned to 6.0.3, not latest
`typescript-eslint@8.72.0` (the only current line) declares `typescript: ">=4.8.4 <6.1.0"` — it **does not
support TypeScript 7**, which is the published latest (7.0.2). Independently, both consumer apps are on
`typescript ^6.0.3`, and `.d.ts` emitted by a newer compiler can fail to parse under an older one. Pin **6.0.3**
exactly. Note TS 6 is stricter than TS 5: an `emitDeclarationOnly` build without an explicit `rootDir` now fails
with **TS5011**, so set `rootDir` in the build tsconfig.

### F5. [LOW] `npm run verify` needs a browser in CI
Either AC16 runner pulls Playwright. CI must install the Chromium browser before `npm run verify`, and
`npm ci` alone is not sufficient.

### F6. [HIGH] **NEW in rev 5 — `@tamagui/core` as a runtime dependency breaks AC12(b)**
`@tamagui/core@3.0.18` depends directly on `@tamagui/react-native-media-driver@3.0.18`, whose manifest declares:

```
"peerDependencies": { "react-native-web": "*" }      // peerDependenciesMeta: undefined — NOT optional
```

npm 7+ auto-installs non-optional peers. **VERIFIED** in a clean install of `@tamagui/core@3.0.18`:

```
└─┬ @tamagui/core@3.0.18
  ├─┬ @tamagui/react-native-media-driver@3.0.18
  │ └── react-native-web@0.21.4
  └─┬ @tamagui/web@3.0.18
    └─┬ @tamagui/native@3.0.18
      └── react-native-web@0.21.4 deduped
```

So if `@tamagui/core` appears in Bobuttons' **`dependencies`**, the AC15 scratch consumer installs
`react-native-web@0.21.4` and **AC12(b) fails** — "the scratch consumer's installed dependency tree contains no
react-native\* package" is then false, through no fault of the build. (`@tamagui/native` lists it as an
*optional* peer; the media driver does not, which is the one that bites.)

**Decision, now mandatory rather than preferential:** `@tamagui/core` lives in `devDependencies`, is bundled
into `dist`, and Bobuttons ships **no `dependencies` at all** — only `peerDependencies` on `react`/`react-dom`.
`scripts/check-dependencies.mjs` must assert `dependencies` is absent or empty, not merely that it lacks
react-bootstrap. This also retro-justifies the bundling decision: with `@tamagui/*` externalised, AC12(b) is
unsatisfiable without consumer-side overrides.

### F7. [MEDIUM] **NEW in rev 5 — the node16 scratch fixture needs explicit module extensions**
Reproduced while typechecking `griddy-icons` (an ESM-only package) from a fixture without `"type": "module"`:

```
error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls;
however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
```

Same class as pitfall G3. The AC15 scratch consumer must typecheck **both** an ESM and a CJS entry under
`node16` in one package, so the fixture cannot rely on `"type"` alone. Shape it as: `"type": "module"`, ESM
entry `index.mts` → `index.mjs`, CJS entry `index.cts` → `index.cjs`, run as `node index.mjs` and
`node index.cjs`. A bare `index.ts` pair silently typechecks the wrong resolution mode for one of the two.

---

## G. Verified pitfalls the implementation must not walk into

1. `npm publish --dry-run` **exits 0** on a private package. **Re-verified in rev 5 under npm 10.9.3**, three
   cases: `private:true` with no `prepublishOnly` → **exit 0**; a public package with no `prepublishOnly` →
   exit 0; `private:true` **with** a failing `prepublishOnly` → **exit 1**, and it fails before any registry
   contact (so the check is offline-safe). AC14's "both `npm publish` and `npm publish --dry-run` fail" is
   delivered **entirely by `prepublishOnly`**; `private: true` contributes nothing to the exit code and must be
   asserted statically.
2. `files` is **not** applied to `file:` installs (symlink). `exports` is the only real encapsulation boundary.
3. A `require` condition you do not emit fails CJS consumers with **TS1479** under `node16`, passing `bundler`.
4. Peer auto-install reaches the network and picks the newest satisfying major. Pre-seed the scratch consumer
   with the pinned React and keep `--offline` so an unexpected fetch fails loudly (`ENOTCACHED`).
5. `.gitignore` must exist **before** the first `npm pack` — pack writes the `.tgz` into the package root.
6. Mixed `@tamagui/*` versions break at runtime. Pin exactly; never depend on the umbrella `tamagui` package.
7. Never enable the `react-native` export condition or `.native.js` extension resolution (§B2).
8. Do not export a `styled()` result or any inferred Tamagui type from `src/index.ts` (§F1).
9. **New in rev 5:** `npm pack --pack-destination <dir>` **does not create the directory** — npm 10.9.3 fails
   with `ENOENT` if it does not already exist. `scripts/verify.mjs` must `mkdir -p` first.
10. **New in rev 5:** `@tamagui/core` in `dependencies` drags in `react-native-web` (§F6).

---

## H. Shared services / blast radius

- **`src/index.ts` export names and `exports`/`types` map** — the AppGenerator integration contract. Additive
  change only; a rename is a coordinated change across three consumers (AC10).
- **The 34 semantic token names** (§A4) — consumed by every component and by both migrating apps. Fixed once in
  `docs/api/token-mapping.md`.
- **The five dual-app components** (§D, §N3) — mutually incompatible today; the merged superset is written down
  and reviewed *before* implementation (AC13).
- **`IconSource`** (§N2) — every icon-bearing component and both migrating apps depend on this one type.

## I. Scope boundaries actively enforced by this plan

Presentational only: props in, callbacks out; no Electron, IPC, SQLite, network or app logic. No new colour
value. No contrast gating on any theme but `jade-aa`. No modification of either source app. No publish.
No `data-theme` mirror. No react-bootstrap or gluestack dependency. No visual-regression or snapshot testing.
No React Native target. No `griddy-icons` runtime dependency (§N2).

---

## J. Rev-5 resolutions of the twelve review concerns

### N1. [HIGH, concern refuted] AC9 — `TamaguiProvider`'s `defaultTheme` *is* the switch
The concern asserted that `defaultTheme` is an initial value and that runtime switching "normally requires an
inner `<Theme name={theme}>`". **That is not true of `@tamagui/core@3.0.18.** Read the source and then proved it.

Source path (`@tamagui/web/src/views/`): `TamaguiProvider` passes `defaultTheme` straight into
`<ThemeProvider defaultTheme={…}>`, which renders `<Theme name={props.defaultTheme} forceClassName>` **on every
render** and runs a layout effect keyed `[props.defaultTheme, addThemeClassName]` that swaps the
`t_<name>` class on `document.body`. No `useState`, no memo on the name.

**Probe (jsdom + `react-dom/client` + `act`, real `@tamagui/core@3.0.18`, mount counted in a `useEffect([])`):**

| | first render | after swapping the `theme` prop |
|---|---|---|
| mount count | 1 | **1 — no remount** |
| `document.body.className` | `t_alpha` | `t_beta` |
| markup | — | changed |

The same probe run with an inner `<Theme name>` gives the identical result, so the inner `Theme` buys nothing
at the root. SSR confirms the class is also carried by a wrapper element, so it works with no DOM:
`renderToString` under plain Node (`typeof window === 'undefined'`) emitted
`<span class=" t_alpha is_Theme" style="color:var(--color);display:contents">…` and
`<span class=" t_beta  is_Theme" …>` respectively — **2500 and 2583 bytes, non-empty**, which also de-risks
AC15's SSR requirement.

**Decision:** `BobuttonsProvider({ theme = 'default', children })` renders
`<TamaguiProvider config={bobuttonsConfig} defaultTheme={theme}>{children}</TamaguiProvider>` — no inner
`<Theme>`, no `key`. Write the mechanism into the provider as a comment, because `defaultTheme` reads like an
initial value and a future reader will otherwise "fix" it.

**Concern's real residue, kept:** this is 3.0.18 behaviour, and the version is pinned exactly for that reason.
So AC9's "nothing re-mounted" stops being untestable and becomes a gate: **Slice 1 ships a mount-count
regression test** (`src/provider/BobuttonsProvider.remount.test.tsx`) — render a probe child that increments a
counter in `useEffect([], …)`, swap the theme prop, assert the counter is still 1 and that the rendered theme
class changed. ~30 lines, catches both a `key={theme}` regression and a Tamagui upgrade that re-reads
`defaultTheme` as initial-only. This also closes the former "[LOW] AC9 remount hazard is untestable" risk.

**Subtree caveat to document:** the root provider themes the whole document. A story that shows two themes side
by side needs `<Theme name>` or `isSubtreeRoot`; `BobuttonsProvider` is root-only and is not that tool.

### N2. [HIGH, concern upheld] The Icon decision, now made
**Verified facts about `griddy-icons@0.2.0`:** no `dependencies`, one peer (`react >=16.8.0`), 1159 icons,
`"type": "module"` with both `import` and `require` conditions. `IconBase` renders a DOM `<svg>` with
`fill="currentColor"` and spreads caller props *after* it. `IconProps = SVGProps<SVGSVGElement> & { size?:
number | string; filled?: boolean }` — note there is **no `color` prop**; both apps' `color="currentColor"` is
just an SVG attribute passthrough.

**The `fill="black"` problem is real and quantified:** `fill: "black"` occurs **110 times across 72 of the 1159
icons** (the brand set — `Github`, `Google`, `Slack`, `Figma`, `Notion`, `Android`, `Youtube`, …), always on an
inner `<path>`, never on the root `<svg>`. **`Github` is in both apps' tab bars.** Both apps work around it with
a global CSS rule — `DailyTracker/src/styles/global.css:261`:
`/* Some griddy-icons (e.g. Github) hardcode fill="black" — override to inherit */`
`.tab-icon svg path { fill: currentColor !important; }`.
A root-level `<svg fill>` prop **cannot** fix it, because `...rest` never reaches the inner `<path>`.

**Decisions:**
1. **Props-first. `griddy-icons` is a `devDependencies` entry, used only by stories — never imported from
   `src/`.** It therefore contributes nothing to `dist`, nothing to `dependencies` and nothing to the AC12(b)
   tree scan. This keeps the library icon-set-agnostic, which is what AC13's "no app-specific name or type is
   hardcoded" requires.
2. **One exported type is the contract:**
   `export type IconSource = React.ComponentType<{ size?: number | string; color?: string }>` — *exactly* the
   type both apps already declare for `Tab.Icon`, so it is a transcription, not a new invention.
   **VERIFIED assignable:** `const a: IconSource = Github` (and `Flash`, `Settings`) typechecks clean under
   `tsc 6.0.3` with `moduleResolution: bundler`.
3. **`Icon` is a presentational wrapper**, not an icon set:
   `IconProps = { source: IconSource; size?: BobuttonsFontSizeToken | number; color?: BobuttonsColorToken;
   label?: string; decorative?: boolean }`. It renders a token-coloured Tamagui wrapper (so CSS `color` is set
   from a token) and the caller's component inside at `color="currentColor"`.
4. **The `fill="black"` override ships once, in the library, as a port of the apps' existing rule.**
   `BobuttonsProvider` injects a single static `<style>` containing
   `[data-bobuttons-icon] svg path { fill: currentColor; }` (scoped to the `Icon` wrapper's data attribute; no
   `!important` needed since it is more specific than a presentation attribute). This is the only hand-written
   CSS in the library and must be listed as such in the README. `currentColor` is not a colour literal, so the
   AC7 lint rule must whitelist `currentColor`, `transparent`, `inherit`, `none`.
5. **`accessibility`:** `label` required unless `decorative` is true — `Icon` renders `role="img"` +
   `aria-label`, or `aria-hidden="true"`. Without this, axe fails the AC16 gate on every icon-bearing story.

### N3. [HIGH, concern upheld] The merged `TabBar` contract, now specified
Source reality (verified verbatim): both apps declare the identical `Tab` interface
(`{ id: TabId; label: string; Icon: React.ComponentType<{size?: number|string; color?: string}> }`), both
hardcode their own table (oncall 4 tabs, DailyTracker 7), oncall adds a module-level
`export const PINNED_TABS = new Set<TabId>(['settings'])` and filters
`ALL_TABS.filter(t => PINNED_TABS.has(t.id) || visibleTabs.has(t.id))`, and both render `react-bootstrap/Nav`
with `role="tablist"`, `aria-selected` and `id={`tab-${id}`}`.

**Merged contract (goes into `docs/api/shared-components.md` before any code):**

```
export interface BobuttonsTab<Id extends string = string> {
  id: Id
  label: string
  icon: IconSource          // renamed from `Icon`; the prop is data, not a component slot
  pinned?: boolean          // replaces oncall's module-level PINNED_TABS set
}

export interface TabBarProps<Id extends string = string> {
  tabs: ReadonlyArray<BobuttonsTab<Id>>   // REQUIRED — replaces both hardcoded tables
  current: Id
  onChange: (tab: Id) => void
  visibleTabs?: ReadonlySet<Id>           // OPTIONAL — omitted means "show all"
  iconSize?: number                       // default 28, the value both apps pass
  'aria-label'?: string
}
```

**Who owns filtering — decided: the library keeps it.** When `visibleTabs` is supplied, `TabBar` renders
`tabs.filter(t => t.pinned || visibleTabs.has(t.id))`; when omitted, it renders `tabs` unchanged. Rationale:
(a) `visibleTabs` is one of oncall's three props, so dropping it would make AC13's parity test unsatisfiable;
(b) DailyTracker omits it and must keep compiling; (c) the *policy* (which tabs exist, which are pinned) moves
to caller-supplied data exactly as AC13 demands, while the *presentation* (hide a filtered tab) stays where it
already is. `PINNED_TABS` does not survive as an export — it becomes `pinned: true` on the caller's tab object.

**Rendering:** a Tamagui `styled(View)` with `role="tablist"` and buttons with `role="tab"`,
`aria-selected`, `id={`tab-${id}`}` — preserving the source markup's a11y contract, which the AC16 axe gate
will otherwise flag. No `react-bootstrap`.

### N4. [MEDIUM, concern upheld] AC17 needs a time zone, not just a locale
Measured: **32 locale-sensitive formatting calls across both apps, zero with a `timeZone`** (§E). A fixed ISO
`now` plus an explicit locale still renders `Oct 19` vs `Oct 20` depending on the machine's `TZ`. CI pins
`TZ=UTC`, so the divergence appears *only* on developer machines and only sometimes — the worst failure shape.

**Mechanism (three parts, all cheap):**
1. One internal helper, `src/internal/formatInstant.ts`, whose options parameter makes **both** `locale` and
   `timeZone` required. No component calls `toLocale*` or `new Intl.*` directly.
2. Every component that formats a date takes `locale?: string` (default `'en-US'`) and `timeZone?: string`
   (default `'UTC'`) alongside `now`. Defaults are explicit values, never the host's.
3. The `no-raw-style-literals` ESLint rule gains a second check (rename it `bobuttons-internal` with two rules,
   or add `no-implicit-intl`): ban `toLocale*(` and `new Intl.` anywhere under `src/components/`.

Storybook and the Vitest projects set `TZ=UTC` too, so a missed call fails in CI rather than only in review.

### N5. [MEDIUM, concern upheld] Vendoring: sidecar provenance + a real drift check
"Byte-identical copy with a provenance header" was self-contradictory. Corrected:
- `src/themes/themes.source.css` — **byte-identical, no header, nothing added**.
- `src/themes/themes.source.meta.json` — the sidecar, carrying
  `sourcePath` (`../oncall-navigator-app/src/styles/themes.css`), `sourceRepoCommit`, `fileCommit`, `bytes`,
  `sha256`, `copiedAt`, and the one-line refresh command.
- **Measured now, so the Developer can assert it without re-deriving:**
  `sha256 = 2d53dcd8253716d8cc585448a2a2c0eeb3b7391a884af266c789e1aaa6417bba`, `bytes = 8042`,
  oncall repo `HEAD = 40e7a35ef41a2a579e9da548ea369b2e7b2be4fd`, last commit touching the file
  `84f3ab993a476d1746f06f099eeee20f638a8d1b` (2026-09-14).
  (`queue.css` sha256 `8afe0548addd70a1f989f4759869ad901435e694603135ea0b17567eb78d7054` — recorded for the
  AC6 alphas, not vendored.)
- `scripts/check-theme-source.mjs`, in `npm run verify`:
  **(a)** always assert `sha256(themes.source.css) === meta.sha256` — catches a local edit, runs everywhere
  including CI; **(b)** if `meta.sourcePath` **exists** on disk, assert byte equality and fail with the refresh
  command on drift; if it does not exist (CI, or a clone without the sibling repo), **log a skip notice and
  pass**. Never fail for absence — that is the whole reason the file is vendored.

### N6. [MEDIUM, concern upheld] The generator's output must be byte-stable by construction
Generate-and-diff is only a drift gate if the generator is a pure function of its input. Pinned contract for
`scripts/generate-themes.mjs`:
1. **Values are copied verbatim.** Trim surrounding whitespace, change nothing else. **No case normalisation**
   (7 declarations are uppercase hex, §A6), **no rgba re-serialisation** (54 declarations are already `rgba()`),
   no hex→rgb conversion except where AC6 requires it. A "tidy-up" that lowercases `#0D1B2A` is a diff with no
   change behind it, and under AC4's wording it is a defect.
2. **The 8 derived tokens are the only generated values.** Emit format pinned once:
   `rgba(R,G,B,A)` — integer channels, **no spaces** (matching both source files), alpha written with exactly
   two decimals: `0.12`, `0.40`, `0.08`, `0.30`. (AC6 writes `0.40`/`0.30`; `queue.css` writes `0.4`/`0.3`.
   Identical numerically; the generator uses AC6's two-decimal form consistently.)
3. **Key order is the `:root` declaration order**, then the 8 derived keys in a fixed statuses × (bg, border)
   order. Theme order is the `themes.css` block order with `default` first. Never `Object.keys` of a merged map.
4. **The generator is the only writer of its outputs** and emits a
   `// GENERATED BY scripts/generate-themes.mjs — DO NOT EDIT` banner into both files.
5. **Formatting is the generator's own**, not Prettier's: it emits final text, Prettier/ESLint **ignore** both
   generated paths (`.prettierignore` / ESLint `ignores`). Otherwise a Prettier version bump reformats the file
   and verify reports drift that is not drift.
6. **LF line endings and a trailing newline, written with an explicit `'utf8'` encoding**; `.gitattributes`
   pins `* text=auto eol=lf` so a Windows checkout cannot fake a diff.
7. `scripts/check-themes.mjs` runs the generator to a **temp directory** and byte-compares; it never writes into
   the worktree, so verify is read-only and safe to run on a dirty tree. A `--write` flag on the generator is
   the only way to update the committed files.

### N7. [MEDIUM, concern upheld] AC2's "renders every prop it declares" gets a mechanical proxy
Downgrading it to "a reviewed contract" across ~38 mostly-placeholder components was the weakest point in the
plan. The inventory manifest already exists, so the proxy is nearly free. Add to
`scripts/check-inventory-coverage.mjs`:

> For each inventory component, parse `<Name>Props` with the TypeScript compiler API, collect its declared
> property names, load the component's `*.stories.tsx`, union the keys of the default export's `args` with the
> keys of every named story's `args`, and fail listing any declared prop not covered. `children` and
> `aria-*`/`data-*` index signatures are exempt; a prop may be exempted individually only via an explicit
> `/** @storybook-args-exempt <reason> */` JSDoc tag on the prop, which keeps the exemption visible in review.

This proves the story *passes* every prop. Proving the component *renders* it stays a review item — but a
placeholder that ignores a prop it is handed is now the only remaining gap, and the axe + render gate (AC16)
exercises the result.

### N8. [MEDIUM, concern upheld] `createFont` parity must be a compile error, not a runtime hole
**VERIFIED** against `@tamagui/core@3.0.18`: `GenericFont` types `size` as a **total** map over the key set but
`lineHeight`, `letterSpacing`, `weight` and `style` as `Partial<>`. A font declared with
`size: {1,2,3,true}` and `lineHeight: {1}` **constructs without error and renders without error** — the emitted
CSS simply carries `font-size:var(--f-size-3)` and no line-height rule. Exactly the silent runtime hole the
concern describes. (Also verified: a token scale with no `true` key is accepted; include `true` anyway, as
Tamagui uses it for defaults.)

**Fix, in `src/tamagui.config.ts`:**
```
type BobuttonsFontSizeKey = 1 | 2 | … | 18          // one union, derived from the §F2 scale
interface BobuttonsFont {
  family: string
  size:          Record<BobuttonsFontSizeKey, number>
  lineHeight:    Record<BobuttonsFontSizeKey, number>   // total, not Partial
  weight:        Record<BobuttonsFontSizeKey, string>   // total
  letterSpacing: Record<BobuttonsFontSizeKey, number>   // total
}
const body: BobuttonsFont = { … }; const mono: BobuttonsFont = { … }
```
Both families share one key set by construction, and a missing key is a TS error at config-authoring time.
Line heights are **derived, not invented**: `round(size * 1.4)` for body and `round(size * 1.45)` for mono,
written into `docs/api/token-mapping.md` as the stated rule — the source CSS does not declare a line-height for
most sizes, so a documented derivation is the honest option and is not a colour decision. Weights default to
`400` per step with the measured set `300/400/450/500/600/700/800` available as named weight tokens.
`letterSpacing` defaults to `0`. A two-line assertion in `check-themes.mjs` re-asserts key-set equality between
the two families at runtime, so a `// @ts-expect-error` cannot smuggle a hole through.

### N9. [MEDIUM, concern upheld] `scripts/verify.mjs` — one build, one tarball, fixed order
The gates share artefacts, so the pipeline is specified rather than implied. Build **once**, pack **once**,
reuse. Sixteen steps, in this order, aborting on first failure:

| # | step | reads | AC |
|---|---|---|---|
| 1 | `check-dependencies` (incl. empty `dependencies`, §F6) | manifest + lockfile | AC11, AC12 |
| 2 | `check-package-integrity` — static `private === true`, `prepublishOnly` present & non-zero, `prepack === "npm run build"` | manifest | AC14 |
| 3 | `check-theme-source` (sha + skip-if-absent drift) | vendored css + sidecar | AC8 |
| 4 | `check-themes` (generate to temp, byte-diff; `themeNames`; 34-key parity; font key parity) | src | AC3–AC6, AC7 |
| 5 | `eslint .` | src | AC7, AC17 |
| 6 | `tsc --noEmit -p tsconfig.typecheck.bundler.json` | src | AC18 |
| 7 | `tsc --noEmit -p tsconfig.typecheck.node16.json` | src | AC18 |
| 8 | **`npm run build`** — the single build; produces `dist/` | src | AC18 |
| 9 | `check-no-react-native` | `dist/` | AC12(a) |
| 10 | `check-dts-encapsulation` | `dist/` | F1 |
| 11 | `check-dist-size` vs `dist-size-budget.json` | `dist/` | AC19 |
| 12 | `check-inventory-coverage` (incl. the N7 args proxy) | src + stories | AC1, AC2, AC10 |
| 13 | **`mkdir -p .verify-out && npm pack --ignore-scripts --pack-destination .verify-out --json`** — the single tarball | `dist/` | AC14 |
| 14 | `check-package-integrity --tarball` — pack-contents allowlist (from step 13's JSON), exports-encapsulation (deep import → `ERR_PACKAGE_PATH_NOT_EXPORTED` + TS2307), and an executed `npm publish --dry-run` asserted non-zero | the tarball | AC10, AC14 |
| 15 | `check-scratch-install` — cache-warm, `npm install --offline <tgz>`, bundler + node16 typecheck, ESM `.mjs` and CJS `.cjs` `renderToString`, `npm ls` tree scan, tree-shaking size | the **same** tarball | AC15, AC12(b), AC21 |
| 16 | `build-storybook` then the Storybook/Vitest run (two projects) | src | AC16 |
| 17 | `check-version-consistency` | README + manifest | AC20 |

Notes that make this work: `--ignore-scripts` at step 13 is deliberate — it stops `prepack` re-running the
build, so the tarball contains exactly the `dist/` that steps 9–11 just audited (**verified** that
`--ignore-scripts` does skip `prepack`); `prepack`'s *existence and content* are asserted statically at step 2
instead. `.verify-out/` must be created first — **verified** that `npm pack --pack-destination` fails with
`ENOENT` rather than creating it. `.verify-out/` is git-ignored. Steps 1–7 are cheap and run before the
expensive build so a typo fails in seconds. Storybook is last because it is the slowest.

### N10. [LOW, concern upheld] Pin CI's Node
Commit `.nvmrc` containing `22.20.0` (the developer baseline) and have the workflow use
`actions/setup-node` with `node-version-file: .nvmrc` and `cache: npm`. `engines.node: ">=22"` stays as the
consumer-facing floor; `.nvmrc` is the exact build version. Without it, `npm ci` on a different Node major can
rebuild optional platform binaries differently from the committed lockfile.

### N11. [LOW, concern upheld] The README needs a parse contract, not a regex over prose
`check-version-consistency.mjs` reads **marker-delimited fenced JSON blocks**, never prose:

```
<!-- bobuttons:versions:start -->
```json
{ "vite": "8.3.4", "storybook": "10.6.2", "@tamagui/core": "3.0.18",
  "typescript": "6.0.3", "requiresTamaguiVitePlugin": false, "vitePluginRequiresVite": ">=8" }
```
<!-- bobuttons:versions:end -->
```

and the same shape for `bobuttons:distsize`. The check fails if a marker pair is missing, if the block is not
valid JSON, or if any value disagrees with `package.json` / `dist-size-budget.json`. Prose around the block is
free text and cannot make the check pass vacuously or fail spuriously. The human-readable table sits next to
the block and is generated from it by the same script's `--write` mode, so the two cannot disagree.

### N12. [LOW, concern confirms the plan] AC6 derivation — no change
Recorded so it is not re-litigated: the seven non-grove themes declare no `--status-*`/`--sla-*` vars;
`queue.css:208-211` hardcodes rgba values equal to `:root`'s status hexes; grove's `themes.css:216-219` match
grove's own status colours at 0.08/0.30. Flatten-then-alpha reproduces today's rendering exactly. §A3 stands.

---

## Disclosure

Nothing outside `/home/ivana/Desktop/Code/Bobuttons` was written or modified. All rev-5 probes (the jsdom
remount probe, the Node SSR probe, the `createFont` partiality probe, the `griddy-icons` assignability
typecheck, the `npm pack`/`npm publish --dry-run` fixtures and the `@tamagui/core` dependency-tree install) live
in the session scratchpad only; nothing was installed, built or packed inside the project, and nothing was
written into `oncall-navigator-app/` or `DailyTracker/`. Those two repos were **read only** — the style files
and the shared components the ticket designates as read-only reference material — because AC4–AC8, AC13 and the
icon and TabBar concerns cannot be answered without them. `/home/ivana/Desktop/Code/tickets/` was not read; the
TaskSpec already carries its content.

## Plan-approval decisions (author, 2026-10-19)

1. **AC13 call shapes:** the merged shared-component props follow DailyTracker's call shape. The type test is per-prop assignability against DailyTracker's usage.
2. **No deprecated API:** this is a brand-new library, so nothing is defined as deprecated. `colorClass` is not carried over as a passthrough; drop it.
3. **Font sizes:** the scale covers the full 8-36px range the source apps use, not 9-22px.
4. **No change** to the earlier defaults: no `data-theme` mirror, `griddy-icons` story-only devDependency, Tamagui bundled into `dist`.
