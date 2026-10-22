import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { styled, Text, View } from "@tamagui/core";
import { palette, themeNames, themes, type BobuttonsPaletteName } from "../../../themes/themes.generated.js";
import { fontWeights } from "../../../tokens/fontWeights.js";

// A reference page for the named palette. It reads the generated data, so new colours
// appear here as soon as they are added to themes.source.css.

const Grid = styled(View, {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "$3",
});

const Card = styled(View, {
  gap: "$1",
  padding: "$2",
  backgroundColor: "$surface",
  borderWidth: "$0.25",
  borderColor: "$borderColor",
  borderRadius: "$3",
});

// Colours are theme-independent, so the swatch must not depend on the theme either: a
// theme's own background and surfaces are among the colours shown, and would hide them.
// Each swatch sits on half-white, half-black, with a white-and-black double outline, so
// any colour stands out against at least one side whatever the theme.
const Backdrop = styled(View, {
  position: "relative",
  flexDirection: "row",
  height: "$12",
  overflow: "hidden",
  borderRadius: "$2",
});

const Half = styled(View, {
  flex: 1,
});

const SwatchFrame = styled(View, {
  position: "absolute",
  top: "$1.5",
  left: "$1.5",
  right: "$1.5",
  bottom: "$1.5",
  borderWidth: "$0.25",
  borderColor: "$white",
  borderRadius: "$2",
});

const SwatchEdge = styled(View, {
  flex: 1,
  borderWidth: "$0.25",
  borderColor: "$jet",
  borderRadius: "$2",
  overflow: "hidden",
});

const Swatch = styled(View, {
  flex: 1,
});

const Name = styled(Text, {
  fontFamily: "body",
  fontSize: "$8",
  fontWeight: fontWeights.semibold,
  color: "$color",
});

const Detail = styled(Text, {
  fontFamily: "mono",
  fontSize: "$5",
  color: "$textDim",
});

const Used = styled(Text, {
  fontFamily: "body",
  fontSize: "$4",
  color: "$textDim",
});

const Heading = styled(Text, {
  fontFamily: "body",
  fontSize: "$11",
  fontWeight: fontWeights.semibold,
  color: "$color",
  paddingTop: "$5",
  paddingBottom: "$2",
});

const NAMES = Object.keys(palette) as BobuttonsPaletteName[];

// Which semantic tokens, in which themes, resolve to each palette colour.
const usage = new Map<BobuttonsPaletteName, string[]>();
for (const name of NAMES) {
  const hits: string[] = [];
  for (const theme of themeNames) {
    for (const [token, value] of Object.entries(themes[theme])) {
      if (value.toLowerCase() === palette[name]) hits.push(`${theme} ${token}`);
    }
  }
  usage.set(name, hits);
}

// Rough hue family from a #rrggbb value, to group the swatches.
function family(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  if (saturation < 0.12) return "Neutrals";
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 15 || hue >= 350) return "Reds";
  if (hue < 40) return "Oranges and tans";
  if (hue < 65) return "Yellows and golds";
  if (hue < 155) return "Greens";
  if (hue < 195) return "Teals";
  if (hue < 250) return "Blues";
  if (hue < 300) return "Purples";
  return "Pinks and magentas";
}

const FAMILY_ORDER = ["Reds", "Oranges and tans", "Yellows and golds", "Greens", "Teals", "Blues", "Purples", "Pinks and magentas", "Neutrals"];

function lightnessOf(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
}

interface ColorCardProps {
  name: BobuttonsPaletteName;
}

function ColorCard(props: ColorCardProps): React.ReactElement {
  const { name } = props;
  const hits = usage.get(name) ?? [];
  return (
    <Card style={{ width: "11rem" }}>
      <Backdrop>
        <Half backgroundColor="$white" />
        <Half backgroundColor="$jet" />
        <SwatchFrame>
          <SwatchEdge>
            {/* Painted through the token, so this also proves `$name` resolves. */}
            <Swatch data-bobuttons-swatch={name} backgroundColor={`$${name}`} />
          </SwatchEdge>
        </SwatchFrame>
      </Backdrop>
      <Name>{name}</Name>
      <Detail>${name}</Detail>
      <Detail>{palette[name]}</Detail>
      <Used>{hits.length === 0 ? "Not used by a theme yet" : `${hits.slice(0, 3).join(", ")}${hits.length > 3 ? ` +${hits.length - 3} more` : ""}`}</Used>
    </Card>
  );
}

interface PaletteProps {
  /** Group the colours by hue family, or list them alphabetically. */
  groupBy: "hue" | "name";
}

const Title = styled(Text, {
  fontFamily: "body",
  fontSize: "$16",
  fontWeight: fontWeights.bold,
  color: "$color",
});

const Intro = styled(Text, {
  fontFamily: "body",
  fontSize: "$8",
  color: "$textDim",
  paddingTop: "$1",
});

function Palette(props: PaletteProps): React.ReactElement {
  const intro = (
    <View>
      <Title role="heading" aria-level={1}>
        Named palette ({NAMES.length} colours)
      </Title>
      <Intro>
        Each colour is defined once in the main theme and the other themes refer to it by name. Use one as a token, e.g.
        backgroundColor="$jade".
      </Intro>
    </View>
  );

  if (props.groupBy === "name") {
    return (
      <View gap="$4">
        {intro}
        <Grid>
          {[...NAMES].sort().map((name) => (
            <ColorCard key={name} name={name} />
          ))}
        </Grid>
      </View>
    );
  }

  return (
    <View>
      {intro}
      {FAMILY_ORDER.map((group) => {
        const names = NAMES.filter((n) => family(palette[n]) === group).sort((a, b) => lightnessOf(palette[a]) - lightnessOf(palette[b]));
        if (names.length === 0) return null;
        return (
          <View key={group}>
            <Heading role="heading" aria-level={2}>
              {group} ({names.length})
            </Heading>
            <Grid>
              {names.map((name) => (
                <ColorCard key={name} name={name} />
              ))}
            </Grid>
          </View>
        );
      })}
    </View>
  );
}

const meta: Meta<typeof Palette> = {
  title: "Primitives/Colors",
  component: Palette,
  parameters: { fullBleed: true },
  args: { groupBy: "hue" },
  decorators: [
    (Story) => (
      <View padding="$5">
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Palette>;

/** Every named colour, grouped by hue family and ordered dark to light within each. */
export const ByHue: Story = {
  play: async ({ canvasElement }) => {
    const swatches = canvasElement.querySelectorAll("[data-bobuttons-swatch]");
    await expect(swatches).toHaveLength(NAMES.length);
    await expect(new Set(NAMES).size).toBe(NAMES.length);
    // Each family heading shows its count, and together they account for every colour.
    const counts = within(canvasElement)
      .getAllByRole("heading", { level: 2 })
      .map((h) => Number(/\((\d+)\)/.exec(h.textContent ?? "")?.[1]));
    await expect(counts.reduce((a, b) => a + b, 0)).toBe(NAMES.length);
  },
};

export const Alphabetical: Story = {
  args: { groupBy: "name" },
  play: async ({ canvasElement }) => {
    const names = [...canvasElement.querySelectorAll("[data-bobuttons-swatch]")].map((el) => el.getAttribute("data-bobuttons-swatch"));
    await expect(names).toEqual([...NAMES].sort());
  },
};

// Each swatch is painted with its `$name` token; this checks the browser resolved every
// one to the palette value.
export const TokensResolve: Story = {
  play: async ({ canvasElement }) => {
    const resolve = (color: string) => {
      const probe = document.createElement("div");
      probe.style.color = color;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    const wrong = NAMES.filter((name) => {
      const swatch = canvasElement.querySelector(`[data-bobuttons-swatch="${name}"]`);
      return !swatch || getComputedStyle(swatch).backgroundColor !== resolve(palette[name]);
    });
    await expect(wrong).toEqual([]);
  },
};
