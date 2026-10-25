// Native half (B2-AC26). `formatInstant` has exactly one consumer
// (AppHeader's date label) and `formatNumber` has none; neither is exported
// from src/index.ts, so this seam's surface is small by construction.
//
// The support matrix (README) records whether the pinned Hermes/React
// Native build ships `Intl` with full ICU. When it does not, a requested
// locale or `timeZone` that Hermes can't satisfy throws a `RangeError` from
// `Intl.DateTimeFormat`/`Intl.NumberFormat` at CONSTRUCTION time. This must
// never crash a render (B2-AC26: "fails in a defined way", never silently
// nonsense and never a crash): on that error, retry once with a safe,
// locale-free fallback (`undefined` locale, i.e. the JS engine's default,
// and no `timeZone` override) rather than throwing. Any resulting textual
// difference from the web output is either eliminated or recorded as an
// allowed difference in the README's parity section — otherwise it is a
// defect under B2-AC16.
// Duplicated rather than imported from "./formatInstant.js": under
// moduleSuffixes resolution that specifier resolves back to THIS file
// (a self-import), not to the web half.
export interface FormatInstantOptions extends Intl.DateTimeFormatOptions {
  locale: string;
  timeZone: string;
}

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale: string;
}

export function formatInstant(instant: number | Date, options: FormatInstantOptions): string {
  const { locale, timeZone, ...dateTimeOptions } = options;
  const date = instant instanceof Date ? instant : new Date(instant);
  try {
    return new Intl.DateTimeFormat(locale, { ...dateTimeOptions, timeZone }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(undefined, dateTimeOptions).format(date);
    } catch {
      // No Intl.DateTimeFormat at all (no ICU, no fallback available):
      // never throw at render — fall back to the date's own ISO rendering.
      return date.toISOString();
    }
  }
}

export function formatNumber(value: number, options: FormatNumberOptions): string {
  const { locale, ...numberOptions } = options;
  try {
    return new Intl.NumberFormat(locale, numberOptions).format(value);
  } catch {
    try {
      return new Intl.NumberFormat(undefined, numberOptions).format(value);
    } catch {
      return String(value);
    }
  }
}
