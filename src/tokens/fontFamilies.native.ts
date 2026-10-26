// React Native's `fontFamily` takes a single system face name, not a CSS
// stack (B2-AC17): this library ships no font assets, so these are the
// platform's own system faces. "Roboto" is Android's system body face;
// "monospace" is Android's generic monospace family alias. See the README's
// font-ownership section for what a consumer must do to get the web font
// stack on Android instead.
export const fontFamilies = {
  body: "Roboto",
  mono: "monospace",
} as const;
