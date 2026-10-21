# Shared-component prop contract (AC13)

This document is written and reviewed **before** the five shared components (`AppHeader`, `TabBar`,
`CollapsibleSection`, `GithubView`, `SettingsView`) are implemented in Slice 2. It records, for each
one: every prop each source app passes today, the merged superset prop with its type and default,
and the mapping from each app's prop to the merged one.

**Human decision at plan approval (overrides the plan where they conflict):** the merged props follow
**DailyTracker's call shape**. The type-level test (`src/components/shared-props.test-d.ts`, Slice 2)
asserts per-prop assignability against DailyTracker's existing usage, not oncall's. Where DailyTracker
omits a prop oncall has (e.g. `TabBar.visibleTabs`), the merged prop stays **optional** so DailyTracker's
call sites keep compiling.

**Human decision at plan approval:** this is a brand-new library, so nothing is defined as deprecated.
`colorClass` is **not** carried over as a passthrough prop (the plan's revision 5 had proposed keeping
it as a documented-deprecated optional). It is dropped entirely; the merged `CollapsibleSection` only
exposes `accentToken` for styling.

## AppHeader

| | oncall-navigator-app | DailyTracker |
|---|---|---|
| props today | none — title is a module-scope string literal (`'On-Call Navigator'`), date computed with `new Date().toLocaleDateString('en-US', …)` at **module scope** (freezes at import) | none — title is a string literal (`'Daily Tracker'`), date computed in render |

Neither app passes any prop today. AC13 forbids a hardcoded app title, so the merged component
necessarily gains a **required** prop neither app's current call site has — this is accepted (see
docs/context §D.2): "accepts both source apps' existing call shapes" is read as per-prop assignability,
not literal reuse of the current (prop-less) JSX, since AC13 also forbids the hardcoded title that a
literal reuse would require keeping.

**Merged `AppHeaderProps`:**

```ts
export interface AppHeaderProps {
  /** Required — replaces the hardcoded app title in both source apps. */
  title: string;
  /** Instant to render the date from. Defaults to Date.now (AC17). */
  now?: number | Date;
  /** Explicit locale for date formatting. Default 'en-US' (matches both apps). */
  locale?: string;
  /** Explicit IANA time zone. Default 'UTC' (AC17/N4 — neither app passes one today). */
  timeZone?: string;
}
```

Date formatting goes through `src/internal/formatInstant.ts`, never a bare `toLocaleDateString` call
(lint-enforced under `src/components`).

## CollapsibleSection

| prop | oncall-navigator-app | DailyTracker | merged |
|---|---|---|---|
| `label` | required | required | `label: string` (required) |
| `colorClass` | optional (CSS class name, not a colour) | **required** (CSS class name) | **dropped** — see below |
| `count` | optional | absent | `count?: number` |
| `children` | required | required | `children: ReactNode` (required) |
| `defaultOpen` | optional, default `true` | n/a | `defaultOpen?: boolean`, default `true` |
| `defaultCollapsed` | n/a | optional, default `false` | inverted into `defaultOpen` (see below) |
| `headerAction` | optional | absent | `headerAction?: ReactNode` |

Two conflicts AC13 names, resolved:

1. **`colorClass` optional in one app, required in the other.** `colorClass` is a CSS class name, not a
   colour — it cannot pass through into a Tamagui component as styling, and carrying it as an
   accepted-but-ignored passthrough would ship a prop that silently does nothing (see docs/context's
   now-superseded revision-5 proposal). Per the plan-approval decision ("nothing is defined as
   deprecated in a brand-new library"), **`colorClass` is dropped entirely.** The merged component
   exposes `accentToken?: BobuttonsThemeTokenName` as the real, token-based styling API. This means
   oncall's and DailyTracker's literal `colorClass="…"` call sites are **not** directly assignable
   without a rename to `accentToken` at the call site — an accepted, named migration cost (AC13's
   parity test targets DailyTracker's shape per the plan-approval decision, and DailyTracker's
   `colorClass` is itself just a CSS class name standing in for a colour choice, so the migration is a
   rename, not a loss of capability).
2. **`defaultCollapsed` inverted to `defaultOpen`.** Both apps default to *open* (`defaultOpen: true`
   in oncall; `defaultCollapsed: false` in DailyTracker — semantically identical). The merged component
   standardises on the single `defaultOpen` convention; DailyTracker's `defaultCollapsed={false}` maps
   to `defaultOpen={true}` (the merged default), so DailyTracker's default call (no prop passed) is
   directly assignable.

**Merged `CollapsibleSectionProps`:**

```ts
export interface CollapsibleSectionProps {
  label: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean; // default true
  headerAction?: ReactNode;
  accentToken?: BobuttonsThemeTokenName; // replaces colorClass; label colour, defaults to textDim
}
```

## TabBar

Full merged contract specified in docs/context §N3 (reproduced here as the authoritative copy for
AC13):

```ts
export interface BobuttonsTab<Id extends string = string> {
  id: Id;
  label: string;
  icon: IconSource;      // renamed from `Icon`; the prop is data, not a component slot
  pinned?: boolean;       // replaces oncall's module-level PINNED_TABS set
}

export interface TabBarProps<Id extends string = string> {
  tabs: ReadonlyArray<BobuttonsTab<Id>>;   // REQUIRED — replaces both apps' hardcoded tables
  current: Id;
  onChange: (tab: Id) => void;
  visibleTabs?: ReadonlySet<Id>;           // OPTIONAL — omitted means "show all" (DailyTracker's shape)
  iconSize?: number;                        // default 28 (the value both apps pass)
  "aria-label"?: string;
}
```

| prop | oncall-navigator-app | DailyTracker | merged |
|---|---|---|---|
| `current` | required (`TabId`) | required (its own `TabId`) | `current: Id` (generic) |
| `onChange` | required | required | `onChange: (tab: Id) => void` |
| `visibleTabs` | required (`Set<TabId>`) | absent | `visibleTabs?: ReadonlySet<Id>` |
| tab table | module-level hardcoded array + `PINNED_TABS` | module-level hardcoded array | `tabs: ReadonlyArray<BobuttonsTab<Id>>`, `pinned` per-tab |
| icon | app-local `Tab.Icon: ComponentType<{size?, color?}>` | same shape | `icon: IconSource` |

**Who owns filtering:** the library. When `visibleTabs` is supplied, `TabBar` renders
`tabs.filter(t => t.pinned || visibleTabs.has(t.id))`; when omitted (DailyTracker's call shape), it
renders `tabs` unchanged. This keeps DailyTracker's existing (prop-omitted) call directly assignable —
the human decision to target DailyTracker's shape makes this the load-bearing case, not merely a nice
compatibility bonus.

`PINNED_TABS` does not survive as an export; it becomes `pinned: true` on the caller's tab objects.

Rendering preserves the source markup's a11y contract: `role="tablist"`, buttons with `role="tab"`,
`aria-selected`, `id={`tab-${id}`}` — no `react-bootstrap`.

## GithubView / SettingsView (merged generic views)

Both source apps have an app-specific GitHub view and an app-specific settings view. Per the component
inventory, Bobuttons ships **one merged generic `Github` view and one merged generic `Settings` view**
(placeholders acceptable per the out-of-scope list — "polishing or perfecting the conversions"). Their
prop contracts are deferred to Slice 2 component implementation, since (unlike `AppHeader`/`TabBar`/
`CollapsibleSection`) neither source app defines a component actually named `GithubView`/`SettingsView`
with a stable existing prop shape to reconcile against — `GithubView`'s per-app props and the five
`Settings*Tab` components' props will be written up in this same file, in the same format, immediately
before their Slice 2 implementation, per AC13's "written down first" requirement for *that*
component's own PR.

## Icon

```ts
export type IconSource = React.ComponentType<{ size?: number | string; color?: string }>;

export interface IconProps {
  source: IconSource;
  size?: number;                   // px, default 20
  color?: BobuttonsThemeTokenName; // default "color"
  label?: string;                  // accessible name
}
```

Deviation from docs/context §N2: there is no `decorative` flag. An icon with no `label` is hidden
from assistive tech (`aria-hidden`); one with a `label` is `role="img"`. An interface can't express
"label required unless decorative", so omitting the label is the one way to mark it decorative.

## Layout components

These follow DailyTracker's page structure: `.app` > header + (`.frame-left` | `.frame-content` >
`.view` > `.view-card`).

| component | DailyTracker equivalent | props |
|---|---|---|
| `AppShell` | `.app`, `.frame-body`, `.frame-left`, `.frame-content` | `header?`, `sidebar?`, `children`, `overlay?` |
| `ViewPane` | `.view` + `.view-card` (surface card with gradient stripe) | `children` |
| `ViewToolbar` | `.tab-toolbar` | `title?`, `children?` (used when no title), `actions?` |
| `ViewBody` | `.list-wrap` (scrolling, padded content area) | `children` |

`AppShell` fills the viewport (`100vh`) and paints `frameBackground`; the sidebar is omitted when no
`sidebar` is given. `AppHeader` reserves the sidebar's width on its left so the title centres over the
content area.

New size tokens back these: `headerHeight` (38), `sidebarWidth` (80) and `bodyBottomInset` (72), plus
space steps `0.75` (3) and `3.5` (14).

## Settings primitives and structures

Extracted from the Settings views of both source apps (DailyTracker's `SettingsView`, oncall's five
`Settings*Tab` components), which repeat the same controls and structures.

Primitives:

| component | source | notes |
|---|---|---|
| `TextInput` | `.settings-input` | `value`/`onChange(value)`, `type`, `fill`, `compact`, `mono`, `saved`, `onEnter`, `min`/`max`. A native `<input>` inside a token-styled frame |
| `Badge` | `.settings-cal-badge` | `label`, `tone`, `mono`, optional `onRemove` (adds an accessible remove button) |
| `IconButton` | `.sentry-preset-remove`, `.btn-remove-monitor` | `label` is the accessible name; `children` is the glyph or an `Icon` |
| `Checkbox` | `.settings-toggle` | native checkbox, label text toggles it |
| `Radio` / `RadioGroup` | `.settings-radio-label` / `.settings-radio-group` | option card with title and description; `RadioGroup` takes an accessible `label` |
| `Tabs` | `.settings-inner-tabs` | underlined horizontal tabs, generic over the tab id |

Settings structures (`src/components/settings/`):

| component | source | props |
|---|---|---|
| `SettingsLayout` | `.settings-inner-tabs` + `.settings-scroll` | `tabs?`, `children` |
| `SettingsSection` | `.settings-section` + `.settings-section-title` | `title`, `titleAction?`, `children` |
| `SettingsRow` | `.settings-row` / `.settings-jira-field` | `label`, `children`, `stacked?`, `divider?` |
| `SettingsHint` | `.settings-hint` | `children` |
| `AddRow` | `.settings-ics-add`, `.sentry-preset-add` | `children` (inputs), `onAdd`, `actionLabel?` |
| `ListRow` | `.sentry-preset-row` | `title`, `detail?`, `selected?`/`onSelect?` (radio dot), `children` (actions) |
| `ThemeOption` | `.settings-theme-btn` / `.theme-btn` | `label`, `swatches`, `selected`, `onSelect` |

Not extracted: the Jira monitor editor and oncall's workflow-step config rows are one-off layouts built
from these pieces; `Select` and `Switch` are not used in either Settings view.

The provider's injected stylesheet gains a second rule, `[data-bobuttons-input]::placeholder`, because
a placeholder colour can't be set through a style prop. New tokens: `inputWidth` (200),
`inputWidthCompact` (72), `swatch` (13) and space step `12` (48).

## Game primitives

New primitives for apps that aren't derived from the source apps. They live in `src/components/game/`.

### SquareGrid

A fixed-shape grid of small rounded squares.

```ts
export type SquareColor = `$${BobuttonsThemeTokenName}` | (string & {}); // "$primary" or any CSS colour
export type SquareVariant = "filled" | "outlined";

export interface SquareHover {
  color?: SquareColor;   // replaces the fill
  outline?: SquareColor; // adds an outline
}

export interface SquareGridProps {
  columns: number;
  rows: number;
  cells?: ReadonlyArray<SquareGridCell | undefined>; // row-major; missing = blank white
  squareSize?: number;                                // tile height in px, default 40
  aspectRatio?: number;                               // width / height, default 1; > 1 is horizontal
  raised?: boolean;                                   // 3D bottom edge on filled squares
  shadow?: boolean;                                   // soft drop shadow on filled squares
  variant?: SquareVariant;                            // default for squares without their own, "filled"
  hover?: SquareHover;                                // default hover look for filled squares
  onSquarePress?: (row: number, column: number) => void; // zero-based
  "aria-label"?: string;
}

export type SquareGridCell =
  | { color?: SquareColor; variant?: SquareVariant; hover?: SquareHover; raised?: boolean; shadow?: boolean; label?: string; icon?: undefined; text?: string }
  | { color?: SquareColor; variant?: SquareVariant; hover?: SquareHover; raised?: boolean; shadow?: boolean; label?: string; icon: IconSource; text?: undefined };
```

- **Tile shape:** `squareSize` is the tile height and `aspectRatio` (width / height) sets the width, so
  `aspectRatio={1.6}` gives horizontal rectangles. Text and icons are sized from the shorter side.
- **Grid shape:** `columns` x `rows` is fixed. Rows never wrap or shrink, so a parent narrower than the grid
  clips or scrolls it instead of reflowing the squares.
- **Content:** a square is blank, holds an `icon` centred, or shows `text`. Text is clipped to 3
  characters (counted as characters, so emoji aren't split). `icon` and `text` are mutually exclusive.
- **Variants:** a `filled` square is a solid `color` with dark content; an `outlined` square is
  transparent with a `color` border and `color` content. Every square has a 2px border (transparent
  when filled), so adding an outline never changes its size.
- **Colour:** `color` is a theme token written `"$primary"` or any CSS colour, so game colours added to
  the theme later become valid tokens automatically. Until then the default is white
  (`PLACEHOLDER_COLOR`) with black content on filled squares (`PLACEHOLDER_INK`), the one place raw
  colours appear in the component; replace them with tokens when the palette lands.
- **Hover:** opt-in and for filled squares only. Pass `hover` on the grid, or on a square to override
  it, with a `color` (replaces the fill), an `outline` (adds an outline), or both. Colours are
  passed in, not themed defaults. Without `hover`, squares don't react to the pointer.
- **3D and shadow:** both are for filled squares, set on the grid or overridden per square.
  `raised` draws a solid bottom edge that is always a darker shade of the fill (lightness lowered in
  OKLCH), computed in CSS so it works for tokens and any colour and follows hover colour changes.
  `shadow` adds a tight, dark drop shadow (small offset and blur, 65% black). Both draw below the tile,
  which reserves matching bottom space so nothing overlaps. The edge uses CSS relative colour syntax
  (Chrome 119+, Safari 16.4+, Firefox 128+); older browsers render the tile flat.
- **Interaction:** with `onSquarePress` set, every square is focusable and activates on click, Enter or
  Space. Blank squares are then named "Row r, column c" (1-based) unless they have a `label`.
- **Accessibility:** `role="grid"` > `row` > `cell`. Give icon squares a `label`.

## Type-level parity test (Slice 2)

`src/components/shared-props.test-d.ts` asserts, for `AppHeader`, `CollapsibleSection` and `TabBar`:
every prop DailyTracker's existing call sites pass is assignable to the merged prop of the same name
(with `TabBarProps`'s generic `Id` instantiated at DailyTracker's own tab-id union), per the
plan-approval decision to target DailyTracker's call shape specifically.
