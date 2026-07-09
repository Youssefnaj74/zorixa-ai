/** Base path without extension — paired `.webp` / `.avif` live in `public/`. */
export function landingGalleryImage(basePath: string): string {
  return `${basePath}.webp`;
}

export function videoShowcasePoster(basePath: string): string {
  return `${basePath}.webp`;
}
