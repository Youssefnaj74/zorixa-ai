/** Studio example for Image Upscaler — same UGC face, low-res before + 4× upscale after. */

const SHOWCASE_V = "2";

export const IMAGE_UPSCALER_SHOWCASE = {
  beforePath: `/image-showcases/upscaler/before.png?v=${SHOWCASE_V}`,
  afterPath: `/image-showcases/upscaler/after.png?v=${SHOWCASE_V}`,
  historyTitle: "UGC face · 4× upscale",
  historySubtitle: "Example · drag slider to compare"
} as const;
