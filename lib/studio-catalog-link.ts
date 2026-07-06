import {
  INFINITETALK_COMPOSER_ID,
  isAudioToVideoComposerId
} from "@/lib/atlas-audio-to-video";
import {
  KLING_26_MOTION_COMPOSER_ID,
  KLING_30_PRO_MODEL_ID,
  VIDU_Q3_COMPOSER_ID,
  VIDU_Q3_PRO_COMPOSER_ID,
  WAN_22_CHARACTER_SWAP_COMPOSER_ID
} from "@/components/video/bottom-bar-models";
import {
  isAtlasImageComposerId,
  isFluxImageToImageComposerId,
  isFluxTextToImageComposerId
} from "@/lib/atlas-image-model-ids";
import { ATLAS_IMAGE_UPSCALER_COMPOSER_ID } from "@/lib/atlas-image-upscaler";
import { isAtlasVideoComposerId } from "@/lib/atlas-video-model-ids";
import type { ToolCatalogSectionId } from "@/lib/tools-catalog";

export const VIDEO_STUDIO_TABS = [
  "AI Director",
  "Text to Video",
  "Image to Video",
  "Reference to Video",
  "Video to Video",
  "Audio to Video"
] as const;

export type VideoStudioTab = (typeof VIDEO_STUDIO_TABS)[number];

const IMAGE_ACTION_TABS = ["Text to Image", "Image to Image", "Image Upscaler"] as const;
export type ImageStudioTab = (typeof IMAGE_ACTION_TABS)[number];

const VIDEO_TAB_BY_SECTION: Partial<Record<ToolCatalogSectionId, VideoStudioTab>> = {
  "text-to-video": "Text to Video",
  "image-to-video": "Image to Video",
  "reference-to-video": "Reference to Video",
  "video-to-video": "Video to Video",
  "character-swap": "Video to Video"
};

function imageTabForSection(sectionId: ToolCatalogSectionId): ImageStudioTab {
  if (sectionId === "image-to-image") {
    return "Image to Image";
  }
  return "Text to Image";
}

/** Deep link from TTS studio → Audio to Video with preloaded audio. */
export function buildAudioToVideoWithAudioHref(audioUrl: string): string {
  const params = new URLSearchParams({
    tab: "Audio to Video",
    model: INFINITETALK_COMPOSER_ID,
    audio: audioUrl
  });
  return `/video?${params.toString()}`;
}

export const STUDIO_FROM_TOOLS = "tools";

export type ImageStudioLock = {
  tab: ImageStudioTab;
  modelId: string;
  toolTitle?: string;
};

const VIDEO_RESOLUTION_QUERY = new Set(["480p", "720p", "1080p", "4k"]);

/** ?resolution= from studio deep links (e.g. announcement → Seedance 4K). */
export function parseVideoResolutionFromQuery(raw: string | null): string | null {
  const v = raw?.trim().toLowerCase();
  if (v === "2160p") return "4k";
  return v && VIDEO_RESOLUTION_QUERY.has(v) ? v : null;
}

/** Deep link from /tools card → /video or /image with tab + model. */
export function buildCatalogStudioHref(
  sectionId: ToolCatalogSectionId,
  composerModelId: string,
  opts?: { toolName?: string; resolution?: string }
): string {
  const appendTools = (params: URLSearchParams) => {
    params.set("from", STUDIO_FROM_TOOLS);
    const name = opts?.toolName?.trim();
    if (name) params.set("name", name);
  };

  const appendResolution = (params: URLSearchParams) => {
    const resolution = parseVideoResolutionFromQuery(opts?.resolution ?? null);
    if (resolution) params.set("resolution", resolution);
  };

  if (composerModelId === "studio-lipsync") {
    const params = new URLSearchParams({
      tab: "Audio to Video",
      model: INFINITETALK_COMPOSER_ID
    });
    appendTools(params);
    return `/video?${params.toString()}`;
  }

  if (sectionId === "audio-to-video") {
    const params = new URLSearchParams({ tab: "Audio to Video", model: composerModelId });
    appendTools(params);
    return `/video?${params.toString()}`;
  }

  const videoTab = VIDEO_TAB_BY_SECTION[sectionId];
  if (videoTab) {
    const params = new URLSearchParams({ tab: videoTab, model: composerModelId });
    appendTools(params);
    appendResolution(params);
    return `/video?${params.toString()}`;
  }

  const imageTab = imageTabForSection(sectionId);
  const params = new URLSearchParams({ tab: imageTab, model: composerModelId });
  appendTools(params);
  return `/image?${params.toString()}`;
}

/** Locked studio when opened from /tools (one model + tab per card). */
export function parseImageStudioLock(params: URLSearchParams): ImageStudioLock | null {
  if (params.get("from") !== STUDIO_FROM_TOOLS) return null;
  const resolved = resolveImageStudioFromQuery(params.get("tab"), params.get("model"));
  if (!resolved) return null;
  const toolTitle = params.get("name")?.trim();
  return {
    tab: resolved.tab,
    modelId: resolved.model,
    toolTitle: toolTitle || undefined
  };
}

export function parseVideoActionTab(raw: string | null): VideoStudioTab | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "Lipsyncing") return "Audio to Video";
  if (trimmed === "AI Director") return "AI Director";
  if (trimmed === "Character Swap") return "Video to Video";
  const t = trimmed as VideoStudioTab;
  return (VIDEO_STUDIO_TABS as readonly string[]).includes(t) ? t : null;
}

export function parseImageActionTab(raw: string | null): ImageStudioTab | null {
  if (!raw) return null;
  const t = raw.trim() as ImageStudioTab;
  return IMAGE_ACTION_TABS.includes(t) ? t : null;
}

/** Apply ?tab= & ?model= from /tools navigation. */
export function resolveVideoStudioFromQuery(
  tabRaw: string | null,
  modelRaw: string | null
): { tab: VideoStudioTab; model: string } | null {
  const tab = parseVideoActionTab(tabRaw);
  const model =
    modelRaw && isAtlasVideoComposerId(modelRaw.trim()) ? modelRaw.trim() : null;

  if (model === KLING_26_MOTION_COMPOSER_ID) {
    return { tab: "Video to Video", model: KLING_26_MOTION_COMPOSER_ID };
  }
  if (model === WAN_22_CHARACTER_SWAP_COMPOSER_ID) {
    return { tab: "Video to Video", model: WAN_22_CHARACTER_SWAP_COMPOSER_ID };
  }
  if (model === VIDU_Q3_COMPOSER_ID) {
    return { tab: tab ?? "Reference to Video", model: VIDU_Q3_COMPOSER_ID };
  }
  if (model === VIDU_Q3_PRO_COMPOSER_ID) {
    if (tab === "Reference to Video") {
      return { tab, model: VIDU_Q3_COMPOSER_ID };
    }
    return { tab: tab ?? "Text to Video", model: VIDU_Q3_PRO_COMPOSER_ID };
  }
  if (model === "wan-2-6") {
    return { tab: tab ?? "Video to Video", model: "wan-2-6" };
  }
  if (model === "studio-lipsync") {
    return { tab: "Audio to Video", model: INFINITETALK_COMPOSER_ID };
  }
  if (tab === "Audio to Video") {
    if (model && isAudioToVideoComposerId(model)) {
      return { tab, model };
    }
    return { tab, model: model ?? INFINITETALK_COMPOSER_ID };
  }
  if (model && isAudioToVideoComposerId(model)) {
    return { tab: "Audio to Video", model };
  }
  if (tab === "Reference to Video") {
    return { tab, model: model ?? "seedance-2" };
  }
  if (tab === "Video to Video") {
    return { tab, model: model ?? "wan-2-6" };
  }
  if (model === KLING_30_PRO_MODEL_ID) {
    return { tab: "Text to Video", model: KLING_30_PRO_MODEL_ID };
  }
  if (tab && model) {
    return { tab, model };
  }
  if (tab) {
    return { tab, model: model ?? "seedance-2" };
  }
  if (model) {
    return { tab: "Image to Video", model };
  }
  return null;
}

export function resolveImageStudioFromQuery(
  tabRaw: string | null,
  modelRaw: string | null
): { tab: ImageStudioTab; model: string } | null {
  const tab = parseImageActionTab(tabRaw) ?? "Text to Image";
  if (tab === "Image Upscaler") {
    return { tab, model: ATLAS_IMAGE_UPSCALER_COMPOSER_ID };
  }
  const model =
    modelRaw && isAtlasImageComposerId(modelRaw.trim()) ? modelRaw.trim() : null;
  if (!model) return null;
  if (tab === "Image to Image" && isFluxTextToImageComposerId(model)) {
    return { tab, model: "flux-kontext-dev" };
  }
  if (tab === "Text to Image" && isFluxImageToImageComposerId(model)) {
    return { tab, model: "flux-dev" };
  }
  if (model === "wan-2-6") {
    return { tab, model: "wan-image-2-6" };
  }
  return { tab, model };
}
