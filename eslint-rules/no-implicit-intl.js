// Bans bare `toLocale*(` and `Intl.*` under src/components. Formatting must go
// through src/internal/formatInstant.ts, which requires an explicit locale and
// timeZone.

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "ban bare toLocale*()/new Intl.* calls in favour of src/internal/formatInstant.ts",
    },
    schema: [],
    messages: {
      toLocale: "Bare '{{name}}()' is forbidden under src/components. Route formatting through src/internal/formatInstant.ts, which requires an explicit locale and timeZone.",
      newIntl: "'new Intl.{{name}}' is forbidden under src/components. Route formatting through src/internal/formatInstant.ts, which requires an explicit locale and timeZone.",
      callIntl: "'Intl.{{name}}(...)' is forbidden under src/components. Route formatting through src/internal/formatInstant.ts, which requires an explicit locale and timeZone.",
    },
  },
  create(context) {
    function isIntlMemberCallee(callee) {
      return (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        callee.object.name === "Intl" &&
        callee.property.type === "Identifier"
      );
    }
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          /^toLocale/.test(callee.property.name)
        ) {
          context.report({
            node,
            messageId: "toLocale",
            data: { name: callee.property.name },
          });
          return;
        }
        // `Intl.DateTimeFormat(...)` without `new` is also valid.
        if (isIntlMemberCallee(callee)) {
          context.report({
            node,
            messageId: "callIntl",
            data: { name: callee.property.name },
          });
        }
      },
      NewExpression(node) {
        const callee = node.callee;
        if (isIntlMemberCallee(callee)) {
          context.report({
            node,
            messageId: "newIntl",
            data: { name: callee.property.name },
          });
        }
      },
    };
  },
};

export default rule;
