/**
 * Tools gallery catalog — built from Atlas-backed composer maps.
 * Credits are placeholders until Atlas pricing is wired per model.
 */

import { ATLAS_IMAGE_MODEL_MAP } from "@/lib/atlas-image-model-ids";
import { ATLAS_VIDEO_MODEL_MAP } from "@/lib/atlas-video-model-ids";

export type ToolCatalogSectionId =
  | "text-to-image"
  | "image-to-image"
  | "image-editing"
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "video-to-video";

export type ToolCatalogItem = {
  id: string;
  sectionId: ToolCatalogSectionId;
  title: string;
  subtitle?: string;
  creditsLabel: string;
  href: string;
  composerModelId: string;
  /** Gradient key for card thumbnail (no remote assets yet). */
  thumbVariant: string;
  wired: boolean;
  badge?: "NEW" | "PRO";
};

export type ToolCatalogSection = {
  id: ToolCatalogSectionId;
  title: string;
  items: ToolCatalogItem[];
};

const IMAGE_LABELS: Record<string, string> = {
  "gpt-image-2": "GPT Image 2",
  "nano-banana-2": "Nano Banana 2",
  "nano-banana-pro": "Nano Banana Pro",
  zorixa: "Zorixa",
  "seedream-5": "Seedream 5 Lite",
  "grok-imagine": "Grok Imagine"
};

const VIDEO_LABELS: Record<string, string> = {
  "kling-3-pro": "Kling 3.0 Pro",
  "kling-2-6-motion": "Kling 2.6 Motion",
  "seedance-2": "Seedance 2.0",
  "seedance-1-5": "Seedance 1.5 Pro",
  "wan-2-6": "Wan 2.6",
  "hailuo-2-3": "Hailuo 2.3",
  "google-veo-3-1": "Google Veo 3.1"
};

const CREDITS_PLACEHOLDER = "Credits TBD";

function imageName(id: string): string {
  return IMAGE_LABELS[id] ?? id;
}

function videoName(id: string): string {
  return VIDEO_LABELS[id] ?? id;
}

function imageItems(
  sectionId: ToolCatalogSectionId,
  titleSuffix: string,
  thumbPrefix: string
): ToolCatalogItem[] {
  return Object.keys(ATLAS_IMAGE_MODEL_MAP).map((id) => ({
    id: `${sectionId}-${id}`,
    sectionId,
    title: `${imageName(id)} ${titleSuffix}`,
    creditsLabel: CREDITS_PLACEHOLDER,
    href: "/image",
    composerModelId: id,
    thumbVariant: `${thumbPrefix}-${id}`,
    wired: true,
    badge: id === "nano-banana-pro" || id === "gpt-image-2" ? "NEW" : undefined
  }));
}

function videoItems(
  sectionId: ToolCatalogSectionId,
  titleSuffix: string,
  thumbPrefix: string,
  opts?: { filter?: (id: string) => boolean; href?: string; badge?: (id: string) => ToolCatalogItem["badge"] }
): ToolCatalogItem[] {
  return Object.keys(ATLAS_VIDEO_MODEL_MAP)
    .filter((id) => (opts?.filter ? opts.filter(id) : true))
    .map((id) => ({
      id: `${sectionId}-${id}`,
      sectionId,
      title: `${videoName(id)} ${titleSuffix}`,
      creditsLabel: CREDITS_PLACEHOLDER,
      href: opts?.href ?? "/video",
      composerModelId: id,
      thumbVariant: `${thumbPrefix}-${id}`,
      wired: true,
      badge: opts?.badge?.(id)
    }));
}

/** Full tools gallery for /tools — Atlas Cloud skeleton (pricing wired later). */
export function buildToolsCatalog(): ToolCatalogSection[] {
  return [
    {
      id: "text-to-image",
      title: "TEXT TO IMAGE",
      items: imageItems("text-to-image", "Text to Image", "t2i")
    },
    {
      id: "image-to-image",
      title: "IMAGE TO IMAGE",
      items: imageItems("image-to-image", "Image to Image", "i2i")
    },
    {
      id: "image-editing",
      title: "IMAGE EDITING",
      items: imageItems("image-editing", "Edit", "edit")
    },
    {
      id: "text-to-video",
      title: "TEXT TO VIDEO",
      items: videoItems("text-to-video", "Text to Video", "t2v", {
        badge: (id) => (id === "kling-3-pro" ? "PRO" : id === "seedance-2" ? "NEW" : undefined)
      })
    },
    {
      id: "image-to-video",
      title: "IMAGE TO VIDEO",
      items: videoItems("image-to-video", "Image to Video", "i2v", {
        badge: (id) => (id === "seedance-1-5" ? "PRO" : id === "seedance-2" ? "NEW" : undefined)
      })
    },
    {
      id: "reference-to-video",
      title: "REFERENCE TO VIDEO",
      items: videoItems("reference-to-video", "Reference to Video", "r2v", {
        filter: (id) => id === "seedance-2",
        badge: () => "NEW"
      })
    },
    {
      id: "video-to-video",
      title: "VIDEO TO VIDEO",
      items: [
        ...videoItems("video-to-video", "Video to Video", "v2v", {
          filter: (id) => id === "wan-2-6"
        }),
        ...videoItems("video-to-video", "Motion Control", "motion", {
          filter: (id) => id === "kling-2-6-motion",
          badge: () => "PRO"
        }),
        {
          id: "v2v-lipsync",
          sectionId: "video-to-video",
          title: "Lipsyncing Studio",
          subtitle: "Audio-driven video",
          creditsLabel: CREDITS_PLACEHOLDER,
          href: "/video",
          composerModelId: "studio-lipsync",
          thumbVariant: "v2v-lipsync",
          wired: true
        }
      ]
    }
  ];
}

export const TOOLS_CATALOG_SECTIONS = buildToolsCatalog();
