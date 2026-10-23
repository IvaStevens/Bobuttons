// Forbids raw px/colour literals and theme-name literals in component source.
// Non-colour keywords are allowed (e.g. `currentColor` for the Icon override).
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

// Tamagui treats a bare number on a dimensional property as px, so these are
// checked for raw numbers too. Unitless props (`opacity`, `flex`, `zIndex`)
// are deliberately absent.
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
