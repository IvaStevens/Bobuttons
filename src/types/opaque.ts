// Opaque public types for values whose real shape comes from @tamagui/*
// internals. No imports, so it can't leak a @tamagui/* reference into the
// .d.ts. Only reached via an `as unknown as X` cast in src/index.ts.
export interface BobuttonsTamaguiConfig {
  readonly __bobuttonsTamaguiConfigBrand: true;
}
