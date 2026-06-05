/** Public paths for Atlas-generated Image-to-Image showcase assets (see `npm run generate:i2i-showcases`). */
export const I2I_SHOWCASE_SHARED_REFERENCE = "/image-showcases/i2i/_shared/reference.png";
export const I2I_SHOWCASE_SHARED_STYLE = "/image-showcases/i2i/_shared/style.png";

export function i2iShowcaseOutputPath(modelId: string): string {
  return `/image-showcases/i2i/${modelId}/output.png`;
}
