// An invalid token reference (e.g. `$border` for `$borderColor`) doesn't throw;
// Tamagui just logs `[tamagui] ...`. Fail any test that logs one.
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
