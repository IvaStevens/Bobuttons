// AC7: no raw px or colour literal in component source outside src/tamagui.config.ts.
// AC6: no theme-name literal and no "grove" special case under src/components.
// Non-colour keywords are whitelisted (docs/context §N2.4) because the Icon
// component's hand-written CSS override must reference `currentColor`.
const NON_COLOUR_KEYWORDS = new Set([
  "currentColor",
  "transparent",
  "inherit",
  "none",
  "auto",
  "unset",
  "initial",
]);

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;
const RGB_FN = /\b(rgba?|hsla?)\s*\(/;
const RAW_PX = /^-?\d+(\.\d+)?px$/;

// Review finding (medium): Tamagui treats a bare NUMBER on a dimensional
// style property as px (e.g. `borderWidth: 1` === `borderWidth: "1px"`), so
// the string-only RAW_PX regex above let `borderWidth: 1` and similar pass
// silently (reproduced: Button.tsx shipped `borderWidth: 1` through a green
// lint run). This set names the dimensional properties a raw NUMBER is
// checked against; anything NOT in this set (e.g. `opacity`, `flex`,
// `zIndex`, `tabIndex`, `maxLength`, array indices, loop counters) is left
// alone, because those are genuinely unitless or not style values at all.
const DIMENSIONAL_NUMERIC_PROPS = new Set([
  "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
  "top", "left", "right", "bottom",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "marginHorizontal", "marginVertical", "marginStart", "marginEnd",
  "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "paddingHorizontal", "paddingVertical", "paddingStart", "paddingEnd",
  "gap", "rowGap", "columnGap",
  "borderWidth", "borderTopWidth", "borderBottomWidth", "borderLeftWidth", "borderRightWidth",
  "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",
  "fontSize", "lineHeight", "letterSpacing",
]);

const THEME_NAMES = [
  "default",
  "ocean",
  "terminal",
  "coastal",
  "dusk",
  "velvet",
  "jade",
  "jade-aa",
  "grove",
];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "forbid raw px/colour literals and theme-name branching under src/components",
    },
    schema: [],
    messages: {
      rawColor: "Raw colour literal '{{value}}' is forbidden outside src/tamagui.config.ts. Use a theme token.",
      rawPx: "Raw px literal '{{value}}' is forbidden outside src/tamagui.config.ts. Use a token from the config scales.",
      rawNumericPx: "Raw numeric style value {{prop}}: {{value}} is forbidden outside src/tamagui.config.ts (Tamagui treats a bare number here as px). Use a token from the config scales.",
      themeBranch: "Theme-name literal '{{value}}' is forbidden in component source. Components must read tokens only, never branch on theme name.",
    },
  },
  create(context) {
    function propNameOf(node) {
      const parent = node.parent;
      if (!parent) return null;
      if (parent.type === "Property" || parent.type === "ObjectProperty") {
        if (parent.key.type === "Identifier") return parent.key.name;
        if (parent.key.type === "Literal") return String(parent.key.value);
      }
      if (parent.type === "JSXAttribute" && parent.name?.type === "JSXIdentifier") {
        return parent.name.name;
      }
      return null;
    }

    function checkLiteralValue(node, raw) {
      if (typeof raw !== "string") return;
      if (NON_COLOUR_KEYWORDS.has(raw)) return;
      if (HEX_COLOR.test(raw) || RGB_FN.test(raw)) {
        context.report({ node, messageId: "rawColor", data: { value: raw } });
        return;
      }
      if (RAW_PX.test(raw)) {
        context.report({ node, messageId: "rawPx", data: { value: raw } });
        return;
      }
      if (THEME_NAMES.includes(raw)) {
        context.report({ node, messageId: "themeBranch", data: { value: raw } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkLiteralValue(node, node.value);
          return;
        }
        if (typeof node.value === "number" && node.value !== 0) {
          const prop = propNameOf(node);
          if (prop && DIMENSIONAL_NUMERIC_PROPS.has(prop)) {
            context.report({ node, messageId: "rawNumericPx", data: { prop, value: String(node.value) } });
          }
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkLiteralValue(node, quasi.value.raw);
        }
      },
    };
  },
};

export default rule;
