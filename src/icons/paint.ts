// Shared lucide paint constants. Deliberately has NO `.native` sibling: both
// platforms reading the exact same module (not two copies with the same
// values) is what proves, by construction, that web and native paint the
// same viewBox/stroke width/caps — there is nothing here that could drift
// per platform.
export const VIEW_BOX = "0 0 24 24";
export const DEFAULT_SIZE = 24;
export const STROKE_WIDTH = 2;
export const STROKE_LINECAP = "round";
export const STROKE_LINEJOIN = "round";
