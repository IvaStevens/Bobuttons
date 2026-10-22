// Single public entry point. Exported components have hand-written props
// interfaces and explicit return types; nothing inferred from @tamagui/* is
// exported, which keeps the emitted .d.ts free of @tamagui/* references.
export { BobuttonsProvider } from "./provider/BobuttonsProvider.js";
export type { BobuttonsProviderProps } from "./provider/BobuttonsProvider.js";

// Exported through an opaque type: the real type comes from `createTamagui`
// and must not appear in the public .d.ts (consumers fail with TS2307).
import { bobuttonsConfig as _bobuttonsConfig } from "./tamagui.config.js";
import type { BobuttonsTamaguiConfig } from "./types/opaque.js";

export const bobuttonsConfig: BobuttonsTamaguiConfig = _bobuttonsConfig as unknown as BobuttonsTamaguiConfig;

// Re-exported from themes.generated.js, not tamagui.config.js: re-exporting
// from the config would make dist/index.d.ts import dist/tamagui.config.d.ts,
// which references @tamagui/web and is unresolvable for consumers.
export { themeNames } from "./themes/themes.generated.js";
export type { BobuttonsThemeName } from "./themes/themes.generated.js";
export type { BobuttonsTamaguiConfig } from "./types/opaque.js";

export { Button } from "./components/primitives/Button/Button.js";
export type { ButtonProps } from "./components/primitives/Button/Button.js";

// Sourced from the @tamagui-free fontWeights.js for the same reason as above.
export { fontWeights } from "./tokens/fontWeights.js";
export type { BobuttonsFontWeightName } from "./tokens/fontWeights.js";
export { breakpoints } from "./tokens/breakpoints.js";
export type { BobuttonsBreakpointName } from "./tokens/breakpoints.js";

export { Icon } from "./components/primitives/Icon/Icon.js";
export type { IconProps, IconSource } from "./components/primitives/Icon/Icon.js";

export { AppHeader } from "./components/shell/AppHeader/AppHeader.js";
export type { AppHeaderProps } from "./components/shell/AppHeader/AppHeader.js";
export { TabBar } from "./components/shell/TabBar/TabBar.js";
export type { BobuttonsTab, TabBarProps } from "./components/shell/TabBar/TabBar.js";
export { CollapsibleSection } from "./components/shell/CollapsibleSection/CollapsibleSection.js";
export type { CollapsibleSectionProps } from "./components/shell/CollapsibleSection/CollapsibleSection.js";

export { AppShell } from "./components/layout/AppShell/AppShell.js";
export type { AppShellProps } from "./components/layout/AppShell/AppShell.js";
export { ViewPane } from "./components/layout/ViewPane/ViewPane.js";
export type { ViewPaneProps } from "./components/layout/ViewPane/ViewPane.js";
export { ViewToolbar } from "./components/layout/ViewToolbar/ViewToolbar.js";
export type { ViewToolbarProps } from "./components/layout/ViewToolbar/ViewToolbar.js";
export { ViewBody } from "./components/layout/ViewBody/ViewBody.js";
export type { ViewBodyProps } from "./components/layout/ViewBody/ViewBody.js";

export type { BobuttonsThemeTokenName } from "./types/tokens.js";

export { TextInput } from "./components/primitives/TextInput/TextInput.js";
export type { TextInputProps } from "./components/primitives/TextInput/TextInput.js";
export { Badge } from "./components/primitives/Badge/Badge.js";
export type { BadgeProps } from "./components/primitives/Badge/Badge.js";
export { IconButton } from "./components/primitives/IconButton/IconButton.js";
export type { IconButtonProps } from "./components/primitives/IconButton/IconButton.js";
export { Checkbox } from "./components/primitives/Checkbox/Checkbox.js";
export type { CheckboxProps } from "./components/primitives/Checkbox/Checkbox.js";
export { Radio } from "./components/primitives/Radio/Radio.js";
export type { RadioProps } from "./components/primitives/Radio/Radio.js";
export { RadioGroup } from "./components/primitives/RadioGroup/RadioGroup.js";
export type { RadioGroupProps } from "./components/primitives/RadioGroup/RadioGroup.js";
export { Tabs } from "./components/primitives/Tabs/Tabs.js";
export type { BobuttonsTabsItem, TabsProps } from "./components/primitives/Tabs/Tabs.js";

export { SettingsLayout } from "./components/settings/SettingsLayout/SettingsLayout.js";
export type { SettingsLayoutProps } from "./components/settings/SettingsLayout/SettingsLayout.js";
export { SettingsSection } from "./components/settings/SettingsSection/SettingsSection.js";
export type { SettingsSectionProps } from "./components/settings/SettingsSection/SettingsSection.js";
export { SettingsRow } from "./components/settings/SettingsRow/SettingsRow.js";
export type { SettingsRowProps } from "./components/settings/SettingsRow/SettingsRow.js";
export { SettingsHint } from "./components/settings/SettingsHint/SettingsHint.js";
export type { SettingsHintProps } from "./components/settings/SettingsHint/SettingsHint.js";
export { AddRow } from "./components/settings/AddRow/AddRow.js";
export type { AddRowProps } from "./components/settings/AddRow/AddRow.js";
export { ListRow } from "./components/settings/ListRow/ListRow.js";
export type { ListRowProps } from "./components/settings/ListRow/ListRow.js";
export { ThemeOption } from "./components/settings/ThemeOption/ThemeOption.js";
export type { ThemeOptionProps } from "./components/settings/ThemeOption/ThemeOption.js";

export { SquareGrid } from "./components/game/SquareGrid/SquareGrid.js";
export type {
  SquareColor,
  SquareGridCell,
  SquareGridProps,
  SquareHover,
  SquareVariant,
} from "./components/game/SquareGrid/SquareGrid.js";

export { TessellatedBackground } from "./components/game/TessellatedBackground/TessellatedBackground.js";
export type {
  TessellatedBackgroundProps,
  TessellatedIcon,
} from "./components/game/TessellatedBackground/TessellatedBackground.js";
