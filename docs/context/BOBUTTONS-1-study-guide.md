# Study guide — BOBUTTONS-1

Patterns worth naming from the Architect's plan and the Developer's implementation.
Not a review: nothing here is about correctness or style.

---

## 1. Dependency inlining to control the consumer's peer graph

*What we did:* `@tamagui/core` is a **devDependency** that gets bundled into `dist`, and the
package ships no `dependencies` field at all — asserted by `check-dependencies.mjs`.

*What it is:* npm auto-installs non-optional `peerDependencies` of transitive deps.
`@tamagui/core` → `@tamagui/react-native-media-driver` declares `react-native-web: "*"` with no
`peerDependenciesMeta.optional`, so anything that lists `@tamagui/core` as a runtime dependency
puts `react-native-web@0.21.4` in every consumer's `node_modules`. Moving the dependency from the
*manifest* into the *bundle* severs that edge: the code is still there, the dependency graph edge
is not.

*Why this over alternatives:* The obvious shape is `dependencies: { "@tamagui/core": "3.0.18" }`
and `external: ["@tamagui/core"]` in the bundler — smaller dist, one copy of Tamagui shared with
a consumer that also uses it directly. That was rejected because it makes AC12(b) literally
unsatisfiable through no fault of the build. Prefer externalising when consumers are expected to
use the same library directly (dual-instance hazards, context identity) and you control their
install; prefer inlining when you are shipping an opaque artifact and the dependency's own peer
graph is hostile.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/scripts/check-dependencies.mjs:20`,
`/home/ivana/Desktop/Code/Bobuttons/tsup.config.ts`

---

## 2. Declaration-surface encapsulation

*What we did:* Every `styled()` result is module-private; each component hand-writes its props
interface and an explicit `React.ReactElement` return type, and `check-dts-encapsulation.mjs`
fails on any `@tamagui/` specifier in emitted `.d.ts`.

*What it is:* TypeScript's declaration emit writes whatever type *inference* produced. Export an
inferred `styled()` value and `tsc` emits `import { … } from '@tamagui/core'` into your public
`.d.ts` — so a bundled runtime dependency reappears as a *type*-level dependency the consumer
cannot resolve (TS2307). An explicit annotation at every export is a barrier that stops inference
escaping the module.

*Why this over alternatives:* The cheap fix is to keep `@tamagui/core` installable by the consumer
(back to entry 1's problem), or to post-process the `.d.ts` with a bundler like `api-extractor` /
`rollup-plugin-dts`, which inlines the referenced types instead of importing them. Declaration
bundling is the right call for a large surface where hand-annotating is impractical; here the
public surface is small and fixed by AC10, so explicit annotation is cheaper and additionally
guarantees the contract is *written down* rather than derived.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/src/components/primitives/Button/Button.tsx:8`,
`:97`, `:113`; `/home/ivana/Desktop/Code/Bobuttons/scripts/check-dts-encapsulation.mjs`

---

## 3. Committed generated artifacts, gated by generate-and-diff

*What we did:* `themes.generated.ts` and `docs/api/token-mapping.md` are produced by
`generate-themes.mjs` and committed; `check-themes.mjs` re-runs the generator into a **temp
directory** and byte-compares against the committed files.

*What it is:* The artifact is in the repo (reviewable, diffable, no build step for consumers) but
the repo is not its source of truth — the generator is. The check is a purity assertion: same
input, same bytes. Writing into a temp dir rather than the worktree keeps `verify` safe to run on
a dirty tree and keeps the gate read-only.

*Why this over alternatives:* The alternatives are (a) generate at build time and gitignore the
output — no review surface for a 9×34 token matrix, and a generator bug ships silently; or (b)
hand-maintain the file — exactly the transcription error AC4 calls a defect. Generate-and-diff is
the right shape whenever the artifact is both derived *and* worth reviewing. It only works if the
generator is a pure function, which is why §N6 pins a byte-stability contract: verbatim value
copying (no hex lowercasing, no rgba re-serialisation), a fixed key order instead of
`Object.keys`, LF + `.gitattributes`, and ESLint `ignores` on the outputs so no formatter can
manufacture a diff.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/scripts/generate-themes.mjs:151`,
`/home/ivana/Desktop/Code/Bobuttons/scripts/check-themes.mjs`,
`/home/ivana/Desktop/Code/Bobuttons/eslint.config.js:18`

---

## 4. Two-tier integrity check on vendored source

*What we did:* `themes.source.css` is a byte-identical vendored copy with a sidecar
`themes.source.meta.json`. `check-theme-source.mjs` **always** asserts `sha256(copy) ===
meta.sha256`, and **conditionally** byte-compares against the sibling repo when that path exists.

*What it is:* Two different failure modes get two different gates. Local tampering with the copy
is always detectable (content-addressing, zero environmental dependency). Upstream drift is only
detectable where upstream is checked out, so that half degrades to a logged no-op instead of a
failure.

*Why this over alternatives:* A single hard check against the sibling repo reddens CI for everyone
without that checkout; dropping the drift check entirely loses the only signal that upstream
moved. Splitting by what each environment can actually observe is the general move. Note the
deliberate wording detail: the absent-sibling branch logs `N/A (sibling repo absent)` rather than
`SKIP`, because `verify.mjs` treats the token `SKIP` as a slice-boundary omission requiring a
ledger entry (see entry 7) — two kinds of "didn't run" that must not collide in one namespace.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/scripts/check-theme-source.mjs:22`, `:40`

---

## 5. Behavioural pin on an undocumented upstream contract

*What we did:* `BobuttonsProvider` renders `<TamaguiProvider defaultTheme={theme}>` with no inner
`<Theme>` and no `key`, and ships `BobuttonsProvider.remount.test.tsx`, which swaps the theme prop
and asserts a child's `useEffect([], …)` mount counter is still `1`.

*What it is:* A characterization test. The behaviour relied on — `defaultTheme` being re-threaded
into `<Theme name>` on every render, despite the name implying initial-only — is a verified
implementation detail of `@tamagui/core@3.0.18`, not a documented API guarantee. The test converts
an unwritten assumption into a failing build the moment an upgrade changes it.

*Why this over alternatives:* The defensive shape most people reach for is `key={theme}` or an
inner `<Theme name={theme}>`. `key` forces a real remount, which AC9 forbids and which would
discard all component state on a theme switch; the inner `<Theme>` was measured to be a no-op at
the root. Reach for the defensive wrapper when you cannot pin the dependency version; reach for
pin + characterization test when you can, since it keeps the simple code *and* makes the upgrade
cost visible.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/src/provider/BobuttonsProvider.tsx:51`,
`/home/ivana/Desktop/Code/Bobuttons/src/provider/BobuttonsProvider.remount.test.tsx`

---

## 6. Hermetic verification of the shipped artifact

*What we did:* `verify.mjs` builds once and packs once
(`npm pack --ignore-scripts --pack-destination .verify-out --json`); every later gate consumes
*those* artifacts. `check-scratch-install.mjs` copies a template fixture into `mkdtemp()` under the
OS temp root — outside the repo — and installs the same tarball there with `npm install --offline`.

*What it is:* Two separate properties. **Artifact identity**: `--ignore-scripts` suppresses
`prepack`, so the tarball contains exactly the `dist` the preceding audits inspected rather than a
fresh rebuild (`prepack`'s existence and content are asserted statically instead). **Hermeticity**:
Node and TypeScript resolve `node_modules` by walking *up* the directory tree, so a fixture nested
inside the repo silently resolves `@tamagui/*`, `@types/react`, `typescript` and `react-native-web`
from the library's own tree — making "the consumer's installed tree is clean" vacuously true.
Moving the fixture outside the repo is what makes the AC12(b) assertion mean anything.
`--offline` closes the third hole: an unexpected fetch fails with `ENOTCACHED` instead of quietly
resolving a newer React major.

*Why this over alternatives:* A nested fixture with `npm link` or a workspace is far easier to wire
and is what most repos do — fine when you are testing your *source*, useless when the thing under
test is packaging. If the question is "does the published artifact work for someone who has none of
my tooling", the test environment must share none of your tooling.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/scripts/check-scratch-install.mjs:59`, `:76`;
`/home/ivana/Desktop/Code/Bobuttons/scripts/verify.mjs`

---

## 7. Expiring-exemption ledger (a ratchet)

*What we did:* Any verify step with no inputs prints `SKIP`; `verify.mjs` fails on any skip not
listed in `scripts/verify.expected-skips.json`, and that file is specified to shrink to `[]` by the
end of Slice 2.

*What it is:* The baseline-file / ratchet pattern — the same idea as an ESLint
`--suppress-all` baseline or a typed-error allowlist. The gate is complete from day one; the
*exceptions* are enumerated, versioned and reviewable, and the direction of travel is enforced
because adding an exception is a visible commit.

*Why this over alternatives:* AC18 ("one complete gate") and AC21 ("verify green in Slice 0 with
zero components") are flatly contradictory without a mechanism. The usual resolutions are to add
steps to verify as slices land (gate is incomplete and nobody can tell what's missing) or to let
steps skip silently (a permanently-broken check looks identical to a not-yet-applicable one). The
ledger makes "green" mean something different, and auditable, in each slice. The known failure
mode is the ledger becoming a parking lot — hence the requirement that every entry carry a reason
naming the slice that removes it.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/scripts/verify.mjs:34`,
`/home/ivana/Desktop/Code/Bobuttons/scripts/verify.expected-skips.json`

---

## 8. Grammar-anchored matching instead of substring matching

*What we did:* The dist scanner matches import/require **specifiers** anchored to
`react-native` / `react-native-web` plus an optional subpath; the CSS parser anchors theme blocks
on `^\[data-theme="([a-z-]+)"\]$` exactly.

*What it is:* Both checks match at a grammatical boundary rather than against raw text, because in
both inputs the naive substring has real false positives:
`@tamagui/react-native-media-driver` is a legitimate scoped package containing the forbidden
string, and `[data-theme="grove"]` appears five times in `themes.css` — once as a theme block and
four times as `[data-theme="grove"] .status-*` descendant rules, which would count grove as five
themes.

*Why this over alternatives:* A full parser (`es-module-lexer`, `postcss`) is the rigorous option
and is worth it when the input is arbitrary. For a known, small, pinned input set an anchored
regex is adequate — provided the anchor is on the *token*, not the *text*. The failure here is not
"regex vs parser", it is matching at the wrong level of the grammar; note also the scanner's
import-form coverage (bare side-effect `import "x"`, dynamic `import("x")`, `require("x")`,
`from "x"`) being kept deliberately identical to its sibling `.d.ts` check so the two cannot
disagree on what counts as an import.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/scripts/check-no-react-native.mjs:21`,
`/home/ivana/Desktop/Code/Bobuttons/scripts/generate-themes.mjs:121`

---

## 9. Strengthening an upstream `Partial<>` into a compile-time total

*What we did:* One `BobuttonsFontSizeKey` union drives
`Record<BobuttonsFontSizeKey, …>` for `size`, `lineHeight`, `weight` *and* `letterSpacing` on both
font families.

*What it is:* Tamagui's `GenericFont` types `size` as total but the other three as `Partial<>`, and
a font with 18 sizes and 1 line-height constructs and renders with no error — the CSS simply
carries no `line-height`. Declaring the key union once and typing every parallel map as a total
`Record` over it turns a missing key from a silent visual bug into a compile error, and makes the
two families key-compatible by construction rather than by discipline.

*Why this over alternatives:* The alternative is a runtime assertion, or nothing. Narrowing a
dependency's deliberately-permissive type in your own layer is the cheaper and earlier gate —
`Record<K, V>` over a shared union is the standard tool (exhaustive `switch` on a discriminated
union is the same idea in statement position). The runtime check is kept anyway in
`check-themes.mjs`, because a single `@ts-expect-error` can smuggle a hole past any compile-time
total.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/src/tamagui.config.ts:86`, `:110`

---

## 10. On-colour token pairing, and why contrast is a property of the composite

*What we did:* `ButtonLabel` uses `$background` as its text colour on filled variants (and `$color`
only on `ghost`); hover/press feedback on filled variants moves the **border**, never the fill; and
`BobuttonsProvider` wraps children in a `View` painting `$background`.

*What it is:* In a token system, a foreground token is only meaningful *relative to the surface it
sits on* — the "on-colour" pairing idea (`primary` / `on-primary` in Material, `fg`/`bg` pairs in
Radix). Two consequences showed up here. The `*Dim`/`*Glow` tokens are low-alpha tints designed to
composite over a surface, so swapping an opaque fill for one of them on hover lets whatever is
behind show through and collapses label contrast (measured 1.31:1). And `TamaguiProvider` sets the
theme's `color` variable but never paints `background-color`, so a transparent `ghost` button was
sitting on the browser's white canvas, not the theme's — the root has to paint the canvas for any
`$color`-on-`$background` pairing to hold.

*Why this over alternatives:* The obvious design is one `interaction` variant that swaps the
background for a tint, which is what most component libraries do — and it is fine when the tint is
opaque and the component's surface is known. Once tokens carry alpha, interaction states must move
a property that cannot break the pairing (border, outline, shadow, transform) or must swap to
another *opaque* step in the same ramp, which is exactly what `ghost` does with
`$surface`/`$surface2`.

*Where:* `/home/ivana/Desktop/Code/Bobuttons/src/components/primitives/Button/Button.tsx:60`,
`:78`; `/home/ivana/Desktop/Code/Bobuttons/src/provider/BobuttonsProvider.tsx:56`
