import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useGlobals } from "storybook/preview-api";
import { Text, Theme, View } from "@tamagui/core";
import { themeNames, type BobuttonsThemeName } from "../../../themes/themes.generated.js";
import { Button } from "./Button.js";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  args: {
    label: "Submit",
    variant: "primary",
    disabled: false,
    "aria-label": undefined,
    onPress: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// Re-rendered under every theme via the toolbar decorator in
// .storybook/preview.tsx; stories never branch on theme name.
export const Primary: Story = {
  args: { label: "Submit", variant: "primary" },
};

export const Secondary: Story = {
  args: { label: "Cancel", variant: "secondary" },
};

export const Ghost: Story = {
  args: { label: "More", variant: "ghost" },
};

export const Disabled: Story = {
  args: { label: "Unavailable", disabled: true },
};

export const Interactive: Story = {
  args: { label: "Press me" },
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: { onPress?: () => void } }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Press me" });
    await userEvent.hover(button);
    button.focus();
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    // Enter and Space must fire onPress via the Button's own key handlers.
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onPress).toHaveBeenCalledTimes(3);
  },
};

// Every variant in one row — the unit both theme stories below repeat.
function VariantRow(): React.ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap="$2" alignItems="center">
      <Button label="Primary" variant="primary" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Ghost" variant="ghost" />
      <Button label="Disabled" disabled />
    </View>
  );
}

interface ThemeSwitchingDemoProps {
  active: BobuttonsThemeName;
  onSelect: (name: BobuttonsThemeName) => void;
}

function ThemeSwitchingDemo(props: ThemeSwitchingDemoProps): React.ReactElement {
  const { active, onSelect } = props;
  return (
    <View gap="$4" alignItems="flex-start">
      <Text fontFamily="body" fontSize="$9" color="$textDim">
        Pick a theme. The same mounted buttons restyle in place: only the
        active theme's tokens change, no component is re-mounted or re-coded.
      </Text>
      <View flexDirection="row" flexWrap="wrap" gap="$2">
        {themeNames.map((name) => (
          <Button
            key={name}
            label={name}
            variant={name === active ? "primary" : "ghost"}
            onPress={() => onSelect(name)}
          />
        ))}
      </View>
      <VariantRow />
      <Text fontFamily="body" fontSize="$7" color="$textFaint">
        Active theme: {active}
      </Text>
    </View>
  );
}

// Click a theme here or use the toolbar; both drive the same global.
export const ThemeSwitching: Story = {
  render: () => {
    const [globals, updateGlobals] = useGlobals();
    return (
      <ThemeSwitchingDemo
        active={globals.theme as BobuttonsThemeName}
        onSelect={(name) => updateGlobals({ theme: name })}
      />
    );
  },
};

// All nine themes at once, each cell in its own <Theme name>.
export const AllThemes: Story = {
  parameters: {
    // Contrast is only gated for jade, but this story renders every theme, so
    // the rule can't be scoped per cell.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
  render: () => (
    <View flexDirection="row" flexWrap="wrap" gap="$4">
      {themeNames.map((name) => (
        <Theme key={name} name={name}>
          <View
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth="$0.25"
            borderRadius="$5"
            padding="$4"
            gap="$3"
            flexGrow={1}
            flexBasis="30%"
          >
            <Text fontFamily="body" fontSize="$9" color="$color">
              {name}
            </Text>
            <VariantRow />
          </View>
        </Theme>
      ))}
    </View>
  ),
};
