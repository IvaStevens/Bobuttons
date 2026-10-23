import { useMedia } from "@tamagui/core";

/** Horizontal padding for content areas: tighter on smaller screens. */
export function useContentInset(desktop: "$6" | "$7" = "$7"): "$4" | "$5" | "$6" | "$7" {
  const media = useMedia();
  if (media.mobile) return "$4";
  if (media.tablet) return "$5";
  return desktop;
}
