// Review finding (high, Button.tsx $border): a dead/invalid token reference
// (e.g. `borderColor: "$border"` when the real token is `$borderColor`) does
// not throw — Tamagui emits the literal value into the stylesheet and logs
// `[tamagui] ...` to the console, so a story with a broken token still
// "renders without throwing" and passes AC16(a) silently. This setup file
// turns any such console message into a hard test failure across the
// Storybook/axe Vitest projects, so a token typo like the one that shipped
// in Button.tsx cannot pass `npm run verify` again.
import { afterEach, beforeEach } from "vitest";

const original = { warn: console.warn, error: console.error };
let seen: string[] = [];

function wrap(fn: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    const text = args.map((a) => String(a)).join(" ");
    if (text.includes("[tamagui]")) {
      seen.push(text);
    }
    fn(...args);
  };
}

beforeEach(() => {
  seen = [];
  console.warn = wrap(original.warn);
  console.error = wrap(original.error);
});

afterEach(() => {
  console.warn = original.warn;
  console.error = original.error;
  if (seen.length > 0) {
    throw new Error(`Tamagui logged ${seen.length} warning(s)/error(s) during this story:\n${seen.join("\n")}`);
  }
});
