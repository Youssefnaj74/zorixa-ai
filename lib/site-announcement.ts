import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";

export const SITE_ANNOUNCEMENT = {
  enabled: true,
  message: "Seedance 4K is now Live →",
  ctaLabel: "Try the model",
  href: buildCatalogStudioHref("text-to-video", "seedance-2", {
    toolName: "Seedance 2.0 Text to Video",
    resolution: "4k"
  })
} as const;
