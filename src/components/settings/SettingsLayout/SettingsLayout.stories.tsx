import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { View } from "@tamagui/core";
import { Badge } from "../../primitives/Badge/Badge.js";
import { Checkbox } from "../../primitives/Checkbox/Checkbox.js";
import { IconButton } from "../../primitives/IconButton/IconButton.js";
import { Radio } from "../../primitives/Radio/Radio.js";
import { RadioGroup } from "../../primitives/RadioGroup/RadioGroup.js";
import { Tabs } from "../../primitives/Tabs/Tabs.js";
import { TextInput } from "../../primitives/TextInput/TextInput.js";
import { ViewPane } from "../../layout/ViewPane/ViewPane.js";
import { AddRow } from "../AddRow/AddRow.js";
import { ListRow } from "../ListRow/ListRow.js";
import { SettingsHint } from "../SettingsHint/SettingsHint.js";
import { SettingsRow } from "../SettingsRow/SettingsRow.js";
import { SettingsSection } from "../SettingsSection/SettingsSection.js";
import { themeNames, themes } from "../../../themes/themes.generated.js";
import { ThemeOption } from "../ThemeOption/ThemeOption.js";
import { SettingsLayout } from "./SettingsLayout.js";

const tabs = [
  { id: "sentry", label: "Sentry" },
  { id: "display", label: "Display" },
];

const themeChoices = themeNames.slice(0, 3).map((name) => ({
  id: name,
  swatches: [themes[name].background, themes[name].primary, themes[name].secondary, themes[name].accent],
}));

function SentryTab(): React.ReactElement {
  const [projects, setProjects] = React.useState(["acme/web", "acme/api"]);
  const [draft, setDraft] = React.useState("");
  const [active, setActive] = React.useState("Unresolved");
  const [auto, setAuto] = React.useState(true);
  const add = () => {
    if (draft.trim()) setProjects([...projects, draft.trim()]);
    setDraft("");
  };

  return (
    <>
      <SettingsSection title="Watched Projects">
        <SettingsHint>Format: org-slug/project-slug.</SettingsHint>
        <View flexDirection="row" flexWrap="wrap" gap="$1.5" paddingHorizontal="$3.5" paddingVertical="$1.5">
          {projects.map((p) => (
            <Badge key={p} label={p} mono onRemove={() => setProjects(projects.filter((x) => x !== p))} />
          ))}
        </View>
        <AddRow onAdd={add}>
          <TextInput fill value={draft} onChange={setDraft} onEnter={add} placeholder="my-org/my-project" aria-label="Project" />
        </AddRow>
      </SettingsSection>

      <SettingsSection title="Filter Presets">
        {["Unresolved", "This week"].map((name) => (
          <ListRow
            key={name}
            title={name}
            detail="--sort new -t 7d"
            selected={active === name}
            onSelect={() => setActive(name)}
          >
            <IconButton label={`Remove ${name}`} tone="danger">
              ×
            </IconButton>
          </ListRow>
        ))}
      </SettingsSection>

      <SettingsSection title="Polling">
        <SettingsRow label="Interval (minutes)">
          <TextInput compact type="number" value="5" onChange={() => undefined} aria-label="Interval" />
        </SettingsRow>
        <SettingsRow label="Auto-investigate new bugs" divider={false}>
          <Checkbox label="Enabled" checked={auto} onChange={setAuto} />
        </SettingsRow>
      </SettingsSection>
    </>
  );
}

function DisplayTab(): React.ReactElement {
  const [theme, setTheme] = React.useState(themeChoices[0]?.id);
  const [alert, setAlert] = React.useState("alarm");
  return (
    <>
      <SettingsSection title="Theme">
        <View flexDirection="row" flexWrap="wrap" gap="$2.5" padding="$3.5">
          {themeChoices.map((t) => (
            <ThemeOption key={t.id} label={t.id} swatches={t.swatches} selected={theme === t.id} onSelect={() => setTheme(t.id)} />
          ))}
        </View>
      </SettingsSection>
      <SettingsSection title="Meeting Alerts">
        <View padding="$3.5">
          <RadioGroup label="Alert style">
            <Radio label="Alarm" description="Visual flash + audio chime" checked={alert === "alarm"} onSelect={() => setAlert("alarm")} />
            <Radio label="No alerts" description="Meetings are silent" checked={alert === "none"} onSelect={() => setAlert("none")} />
          </RadioGroup>
        </View>
      </SettingsSection>
    </>
  );
}

const meta: Meta<typeof SettingsLayout> = {
  title: "Settings/SettingsLayout",
  component: SettingsLayout,
  parameters: { fullBleed: true },
  args: {
    tabs: <Tabs tabs={tabs} current="sentry" onChange={() => undefined} aria-label="Settings sections" />,
    children: <SentryTab />,
  },
  decorators: [
    (Story) => (
      <View backgroundColor="$frameBackground" display="flex" style={{ height: "40rem" }}>
        <ViewPane>
          <Story />
        </ViewPane>
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SettingsLayout>;

export const Default: Story = {};

// Tabs and content wired together, as a consuming view would.
export const WithTabs: Story = {
  render: () => {
    const [current, setCurrent] = React.useState("sentry");
    return (
      <SettingsLayout tabs={<Tabs tabs={tabs} current={current} onChange={setCurrent} aria-label="Settings sections" />}>
        {current === "sentry" ? <SentryTab /> : <DisplayTab />}
      </SettingsLayout>
    );
  },
};
