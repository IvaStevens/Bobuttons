// The two CSS font stacks, byte-for-byte what tamagui.config.ts inlined
// before this seam existed (B2-AC11, B2-AC17). @tamagui-free, like
// fontWeights.ts and breakpoints.ts.
export const fontFamilies = {
  body: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  mono: 'Menlo, Monaco, Consolas, "SF Mono", "Fira Code", monospace',
} as const;
