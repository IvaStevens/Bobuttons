// Standalone and @tamagui-free, like fontWeights.ts, so it can be exported from
// the public entry without pulling tamagui.config.d.ts into consumers' types.
//
// Desktop is the base layout. Each breakpoint is a max-width override, and
// `mobile` is the more specific of the two: below `mobile` both apply and
// `mobile` wins.
export const breakpoints = {
  /** Widest viewport, in px, that gets the tablet layout. */
  tablet: 1023,
  /** Widest viewport, in px, that gets the small-mobile layout. */
  mobile: 599,
} as const;

export type BobuttonsBreakpointName = keyof typeof breakpoints;
