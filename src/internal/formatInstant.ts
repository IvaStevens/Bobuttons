// The single date/number formatting helper. `locale` and `timeZone` are
// required so nothing silently formats against the host's zone. Components
// expose their own `locale`/`timeZone` props (defaults 'en-US' / 'UTC') and
// must not call `toLocale*`/`new Intl.*` directly (`no-implicit-intl` rule).
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
