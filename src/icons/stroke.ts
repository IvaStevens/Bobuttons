// Web half of the one named colour seam used by every pack icon. Kept as a
// one-line named function (not duplicated inline in Glyph.tsx/.native.tsx) so
// the two platform halves of the colour contract have a shared name.
export function resolveStroke(color?: string): string {
  return color ?? "currentColor";
}
