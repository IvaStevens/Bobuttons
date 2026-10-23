import type { BobuttonsPaletteName, BobuttonsThemeTokens } from "../themes/themes.generated.js";

type KnownKeys<T> = keyof {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};

/** Name of a semantic colour token, e.g. "primary" or "textDim". Changes with the active theme. */
export type BobuttonsThemeTokenName = KnownKeys<BobuttonsThemeTokens>;

/** Name of a named palette colour, e.g. "jade" or "deepSea". The same in every theme. */
export type { BobuttonsPaletteName };

/** Any colour token: a semantic one or a palette one. Use as `$${name}`. */
export type BobuttonsColorToken = BobuttonsThemeTokenName | BobuttonsPaletteName;
