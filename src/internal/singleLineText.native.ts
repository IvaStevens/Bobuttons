/**
 * React Native's cross-platform equivalent of "stay on one line, truncate
 * with an ellipsis if it doesn't fit": `numberOfLines`. Tamagui's native
 * `Text` host already defaults `ellipsizeMode` to `"tail"`, so setting only
 * `numberOfLines` is enough.
 */
export const SINGLE_LINE: { numberOfLines: number } = { numberOfLines: 1 };
