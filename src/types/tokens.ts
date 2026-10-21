import type { BobuttonsThemeTokens } from "../themes/themes.generated.js";

type KnownKeys<T> = keyof {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

/** Name of a semantic colour token, e.g. "primary" or "textDim". */
export type BobuttonsThemeTokenName = KnownKeys<BobuttonsThemeTokens>;
