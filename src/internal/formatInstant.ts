// AC17 + docs/context §N4. The single date/number formatting helper.
// Measured: 32 `toLocale*`/`new Intl.*` calls across both source apps, ZERO
// with a `timeZone` — several pass `[]` for locale. `locale` and `timeZone`
// are both REQUIRED here (no defaults), so no call site can silently format
// against the host clock's zone. Components that format dates expose their
// own `locale`/`timeZone` props with explicit defaults ('en-US' / 'UTC') and
// pass them through; they must never call `toLocale*`/`new Intl.*` directly
// — enforced by the `no-implicit-intl` ESLint rule under src/components.
export interface FormatInstantOptions extends Intl.DateTimeFormatOptions {
  locale: string;
  timeZone: string;
}

export function formatInstant(instant: number | Date, options: FormatInstantOptions): string {
  const { locale, timeZone, ...dateTimeOptions } = options;
  const date = instant instanceof Date ? instant : new Date(instant);
  return new Intl.DateTimeFormat(locale, { ...dateTimeOptions, timeZone }).format(date);
}

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale: string;
}

export function formatNumber(value: number, options: FormatNumberOptions): string {
  const { locale, ...numberOptions } = options;
  return new Intl.NumberFormat(locale, numberOptions).format(value);
}
