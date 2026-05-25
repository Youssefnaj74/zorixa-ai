/**
 * Tools gallery catalog — built from Atlas-backed composer maps.
 * Credits are placeholders until Atlas pricing is wired per model.
 */

import {
  ATLAS_IMAGE_MODEL_MAP,
  imageComposerVisibleInToolsSection,
  type ImageToolsSectionId
} from "@/lib/atlas-image-model-ids";
import { AUDIO_TO_VIDEO_COMPOSER_IDS } from "@/lib/atlas-audio-to-video";
import { ATLAS_VIDEO_MODEL_MAP, isGeneralVideoComposerId } from "@/lib/atlas-video-model-ids";
import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";

export type ToolCatalogSectionId =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "video-to-video"
  | "character-swap"
  | "audio-to-video";

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
  /** Static fallback preview shown until the user generates with this model. */
  previewSrc?: string;
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
  zorixa: "Zorixa Image",
  "seedream-5": "Seedream 5 Lite",
  "grok-imagine": "Grok Imagine",
  "flux-dev": "Flux Dev",
  "flux-schnell": "Flux Schnell",
  "flux-dev-lora": "Flux Dev LoRA",
  "flux-kontext-dev": "Flux Kontext Dev",
  "flux-kontext-dev-lora": "Flux Kontext Dev LoRA",
  "wan-image-2-7": "Wan 2.7",
  "wan-image-2-7-pro": "Wan 2.7 Pro",
  "wan-image-2-6": "Wan 2.6"
};

const VIDEO_LABELS: Record<string, string> = {
  "kling-3-pro": "Kling 3.0 Pro",
  "kling-2-6-motion": "Kling 2.6 Motion",
  "seedance-2": "Seedance 2.0",
  "seedance-1-5": "Seedance 1.5 Pro",
  "wan-2-6": "Wan 2.6",
  "wan-2-7": "Wan 2.7",
  "wan-2-2-character-swap": "Wan 2.2 Character Swap",
  "happyhorse-1": "HappyHorse 1.0",
  "hailuo-2-3": "Hailuo 2.3",
  "google-veo-3-1": "Google Veo 3.1",
  "vidu-q3": "Vidu Q3",
  "vidu-q3-pro": "Vidu Q3-Pro",
  infinitetalk: "InfiniteTalk",
  "veed-fabric-1": "VEED Fabric 1.0",
  "veed-fabric-1-fast": "VEED Fabric 1.0 Fast"
};

const CREDITS_PLACEHOLDER = "Credits TBD";

const MODEL_PREVIEWS: Record<string, string> = {
  "gpt-image-2": "/tool-previews/gpt-image-2.png",
  "nano-banana-2": "/tool-previews/nano-banana-2.png",
  "nano-banana-pro": "/tool-previews/nano-banana-pro.png",
  zorixa: "/tool-previews/zorixa.png",
  "seedream-5": "/tool-previews/seedream-5.png",
  "grok-imagine": "/tool-previews/grok-imagine.png",
  "flux-dev": "/tool-previews/flux-dev.png",
  "flux-schnell": "/tool-previews/flux-schnell.png",
  "flux-dev-lora": "/tool-previews/flux-dev-lora.png",
  "flux-kontext-dev": "/tool-previews/flux-kontext-dev.png",
  "flux-kontext-dev-lora": "/tool-previews/flux-kontext-dev-lora.png",
  "wan-image-2-7": "/tool-previews/wan-image-2-7.png",
  "wan-image-2-7-pro": "/tool-previews/wan-image-2-7-pro.png",
  "wan-image-2-6": "/tool-previews/wan-image-2-6.png"
};

function previewFor(sectionId: ToolCatalogSectionId, modelId: string): string | undefined {
  if (sectionId === "image-to-image") {
    return `/tool-previews/image-to-image-${modelId}.png`;
  }
  if (sectionId === "text-to-video") {
    return `/tool-previews/text-to-video-${modelId}.png`;
  }
  if (sectionId === "image-to-video") {
    return `/tool-previews/image-to-video-${modelId}.png`;
  }
  if (sectionId === "reference-to-video") {
    return `/tool-previews/reference-to-video-${modelId}.png`;
  }
  if (sectionId === "video-to-video") {
    return `/tool-previews/video-to-video-${modelId}.png`;
  }
  if (sectionId === "character-swap") {
    return `/tool-previews/character-swap-${modelId}.png`;
  }
  if (sectionId === "audio-to-video") {
    return `/tool-previews/audio-to-video-${modelId}.png`;
  }
  return MODEL_PREVIEWS[modelId];
}

function imageName(id: string): string {
  return IMAGE_LABELS[id] ?? id;
}

function videoName(id: string): string {
  return VIDEO_LABELS[id] ?? id;
}

function imageItems(
  sectionId: ToolCatalogSectionId,
  titleSuffix: string,
  thumbPrefix: string,
  opts?: { badge?: (id: string) => ToolCatalogItem["badge"] }
): ToolCatalogItem[] {
  return Object.keys(ATLAS_IMAGE_MODEL_MAP)
    .filter((id) =>
      imageComposerVisibleInToolsSection(sectionId as ImageToolsSectionId, id)
    )
    .map((id) => ({
      id: `${sectionId}-${id}`,
      sectionId,
      title: `${imageName(id)} ${titleSuffix}`,
      creditsLabel: CREDITS_PLACEHOLDER,
      href: buildCatalogStudioHref(sectionId, id, {
        toolName: `${imageName(id)} ${titleSuffix}`
      }),
      composerModelId: id,
      thumbVariant: `${thumbPrefix}-${id}`,
      previewSrc: previewFor(sectionId, id),
      wired: true,
      badge:
        opts?.badge?.(id) ??
        (id === "nano-banana-pro" ||
        id === "gpt-image-2" ||
        id.startsWith("flux-") ||
        id === "wan-image-2-6"
          ? "NEW"
          : id === "flux-kontext-dev-lora" || id === "wan-image-2-7-pro"
            ? "PRO"
            : undefined)
    }));
}

function videoItems(
  sectionId: ToolCatalogSectionId,
  titleSuffix: string,
  thumbPrefix: string,
  opts?: { filter?: (id: string) => boolean; badge?: (id: string) => ToolCatalogItem["badge"] }
): ToolCatalogItem[] {
  return Object.keys(ATLAS_VIDEO_MODEL_MAP)
    .filter((id) => isGeneralVideoComposerId(id))
    .filter((id) => (opts?.filter ? opts.filter(id) : true))
    .map((id) => ({
      id: `${sectionId}-${id}`,
      sectionId,
      title: `${videoName(id)} ${titleSuffix}`,
      creditsLabel: CREDITS_PLACEHOLDER,
      href: buildCatalogStudioHref(sectionId, id, {
        toolName: `${videoName(id)} ${titleSuffix}`
      }),
      composerModelId: id,
      thumbVariant: `${thumbPrefix}-${id}`,
      previewSrc: previewFor(sectionId, id),
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
      items: imageItems("text-to-image", "Text to Image", "t2i", {
        badge: (id) =>
          id === "wan-image-2-7-pro" || id === "flux-dev-lora"
            ? "PRO"
            : id === "wan-image-2-7" || id === "wan-image-2-6" || id === "flux-schnell"
              ? "NEW"
              : undefined
      })
    },
    {
      id: "image-to-image",
      title: "IMAGE TO IMAGE",
      items: imageItems("image-to-image", "Image to Image", "i2i", {
        badge: (id) =>
          id === "wan-image-2-7-pro" || id === "flux-kontext-dev-lora"
            ? "PRO"
            : id === "wan-image-2-7" || id === "wan-image-2-6" || id.startsWith("flux-")
              ? "NEW"
              : undefined
      })
    },
    {
      id: "text-to-video",
      title: "TEXT TO VIDEO",
      items: videoItems("text-to-video", "Text to Video", "t2v", {
        badge: (id) =>
          id === "kling-3-pro"
            ? "PRO"
            : id === "seedance-2" || id === "wan-2-7"
              ? "NEW"
              : undefined
      })
    },
    {
      id: "image-to-video",
      title: "IMAGE TO VIDEO",
      items: videoItems("image-to-video", "Image to Video", "i2v", {
        badge: (id) =>
          id === "seedance-1-5"
            ? "PRO"
            : id === "happyhorse-1" || id === "seedance-2" || id === "wan-2-7"
              ? "NEW"
              : undefined
      })
    },
    {
      id: "reference-to-video",
      title: "REFERENCE TO VIDEO",
      items: videoItems("reference-to-video", "Reference to Video", "r2v", {
        filter: (id) =>
          id === "seedance-2" ||
          id === "vidu-q3" ||
          id === "happyhorse-1" ||
          id === "wan-2-7" ||
          id === "google-veo-3-1",
        badge: (id) =>
          id === "vidu-q3" ||
          id === "happyhorse-1" ||
          id === "wan-2-7" ||
          id === "google-veo-3-1"
            ? "NEW"
            : undefined
      })
    },
    {
      id: "video-to-video",
      title: "VIDEO TO VIDEO",
      items: videoItems("video-to-video", "Video to Video", "v2v", {
        filter: (id) =>
          id === "wan-2-6" ||
          id === "wan-2-7" ||
          id === "happyhorse-1" ||
          id === "vidu-q3-pro",
        badge: (id) =>
          id === "vidu-q3-pro"
            ? "PRO"
            : id === "happyhorse-1" || id === "wan-2-7"
              ? "NEW"
              : undefined
      })
    },
    {
      id: "character-swap",
      title: "CHARACTER SWAP",
      items: videoItems("character-swap", "Character Swap", "swap", {
        filter: (id) => id === "kling-2-6-motion" || id === "wan-2-2-character-swap",
        badge: (id) =>
          id === "kling-2-6-motion" ? "PRO" : id === "wan-2-2-character-swap" ? "NEW" : undefined
      })
    },
    {
      id: "audio-to-video",
      title: "AUDIO TO VIDEO",
      items: AUDIO_TO_VIDEO_COMPOSER_IDS.map((id) => ({
        id: `audio-to-video-${id}`,
        sectionId: "audio-to-video" as const,
        title: `${videoName(id)} Audio to Video`,
        subtitle: "Portrait + audio → talking video",
        creditsLabel: CREDITS_PLACEHOLDER,
        href: buildCatalogStudioHref("audio-to-video", id, {
          toolName: `${videoName(id)} Audio to Video`
        }),
        composerModelId: id,
        thumbVariant: `a2v-${id}`,
        previewSrc: previewFor("audio-to-video", id),
        wired: true,
        badge:
          id === "veed-fabric-1" || id === "veed-fabric-1-fast" ? ("NEW" as const) : undefined
      }))
    }
  ];
}

export const TOOLS_CATALOG_SECTIONS = buildToolsCatalog();
