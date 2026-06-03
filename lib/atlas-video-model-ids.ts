import { isAudioToVideoComposerId } from "@/lib/atlas-audio-to-video";
import {
  GEMINI_OMNI_FLASH_I2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_R2V_COMPOSER_ID,
  GEMINI_OMNI_FLASH_T2V_COMPOSER_ID
} from "@/lib/atlas-gemini-omni-video";
import {
  GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID,
  GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID
} from "@/lib/atlas-grok-video";

/**
 * Maps Zorixa video composer IDs → Atlas Cloud `generateVideo` `model` slugs.
 * Slugs follow Atlas model library paths (see atlascloud.ai/models).
 */
export type AtlasVideoRouteAction =
  | "text"
  | "image"
  | "reference"
  | "lipsync"
  | "edit"
  | "motion-control"
  | "start-end";

export type AtlasVideoSpeedTier = "standard" | "fast";

type AtlasModelRow = Record<AtlasVideoRouteAction, string>;

/** Default (quality) tier — Pro for Kling, full Seedance 2.0, etc. */
export const ATLAS_VIDEO_MODEL_MAP: Record<string, AtlasModelRow> = {
  [GROK_IMAGINE_VIDEO_T2V_COMPOSER_ID]: {
    text: "xai/grok-imagine-video/text-to-video",
    image: "xai/grok-imagine-video/text-to-video",
    reference: "xai/grok-imagine-video/text-to-video",
    lipsync: "xai/grok-imagine-video/text-to-video",
    edit: "xai/grok-imagine-video/text-to-video",
    "motion-control": "xai/grok-imagine-video/text-to-video",
    "start-end": "xai/grok-imagine-video/text-to-video"
  },
  [GROK_IMAGINE_VIDEO_I2V_15_COMPOSER_ID]: {
    text: "xai/grok-imagine-video-v1.5/image-to-video",
    image: "xai/grok-imagine-video-v1.5/image-to-video",
    reference: "xai/grok-imagine-video-v1.5/image-to-video",
    lipsync: "xai/grok-imagine-video-v1.5/image-to-video",
    edit: "xai/grok-imagine-video-v1.5/image-to-video",
    "motion-control": "xai/grok-imagine-video-v1.5/image-to-video",
    "start-end": "xai/grok-imagine-video-v1.5/image-to-video"
  },
  [GROK_IMAGINE_VIDEO_R2V_COMPOSER_ID]: {
    text: "xai/grok-imagine-video/reference-to-video",
    image: "xai/grok-imagine-video/reference-to-video",
    reference: "xai/grok-imagine-video/reference-to-video",
    lipsync: "xai/grok-imagine-video/reference-to-video",
    edit: "xai/grok-imagine-video/reference-to-video",
    "motion-control": "xai/grok-imagine-video/reference-to-video",
    "start-end": "xai/grok-imagine-video/reference-to-video"
  },
  [GEMINI_OMNI_FLASH_T2V_COMPOSER_ID]: {
    text: "google/gemini-omni-flash/text-to-video-developer",
    image: "google/gemini-omni-flash/text-to-video-developer",
    reference: "google/gemini-omni-flash/text-to-video-developer",
    lipsync: "google/gemini-omni-flash/text-to-video-developer",
    edit: "google/gemini-omni-flash/text-to-video-developer",
    "motion-control": "google/gemini-omni-flash/text-to-video-developer",
    "start-end": "google/gemini-omni-flash/text-to-video-developer"
  },
  [GEMINI_OMNI_FLASH_I2V_COMPOSER_ID]: {
    text: "google/gemini-omni-flash/image-to-video-developer",
    image: "google/gemini-omni-flash/image-to-video-developer",
    reference: "google/gemini-omni-flash/image-to-video-developer",
    lipsync: "google/gemini-omni-flash/image-to-video-developer",
    edit: "google/gemini-omni-flash/image-to-video-developer",
    "motion-control": "google/gemini-omni-flash/image-to-video-developer",
    "start-end": "google/gemini-omni-flash/image-to-video-developer"
  },
  [GEMINI_OMNI_FLASH_R2V_COMPOSER_ID]: {
    text: "google/gemini-omni-flash/reference-to-video-developer",
    image: "google/gemini-omni-flash/reference-to-video-developer",
    reference: "google/gemini-omni-flash/reference-to-video-developer",
    lipsync: "google/gemini-omni-flash/reference-to-video-developer",
    edit: "google/gemini-omni-flash/reference-to-video-developer",
    "motion-control": "google/gemini-omni-flash/reference-to-video-developer",
    "start-end": "google/gemini-omni-flash/reference-to-video-developer"
  },
  "kling-3-pro": {
    text: "kwaivgi/kling-v3.0-pro/text-to-video",
    image: "kwaivgi/kling-v3.0-pro/image-to-video",
    reference: "kwaivgi/kling-v3.0-pro/text-to-video",
    lipsync: "kwaivgi/kling-v3.0-pro/text-to-video",
    edit: "kwaivgi/kling-v3.0-pro/text-to-video",
    "motion-control": "kwaivgi/kling-v3.0-pro/text-to-video",
    "start-end": "kwaivgi/kling-v3.0-pro/image-to-video"
  },
  "kling-2-6-motion": {
    text: "kwaivgi/kling-v2.6-pro/motion-control",
    image: "kwaivgi/kling-v2.6-pro/motion-control",
    reference: "kwaivgi/kling-v2.6-pro/motion-control",
    lipsync: "kwaivgi/kling-v2.6-pro/motion-control",
    edit: "kwaivgi/kling-v2.6-pro/motion-control",
    "motion-control": "kwaivgi/kling-v2.6-pro/motion-control",
    "start-end": "kwaivgi/kling-v2.6-pro/motion-control"
  },
  "seedance-2": {
    text: "bytedance/seedance-2.0/text-to-video",
    image: "bytedance/seedance-2.0/image-to-video",
    reference: "bytedance/seedance-2.0/reference-to-video",
    lipsync: "bytedance/seedance-2.0/text-to-video",
    edit: "bytedance/seedance-2.0/text-to-video",
    "motion-control": "bytedance/seedance-2.0/text-to-video",
    "start-end": "bytedance/seedance-2.0/image-to-video"
  },
  "seedance-1-5": {
    text: "bytedance/seedance-v1.5-pro/text-to-video",
    image: "bytedance/seedance-v1.5-pro/image-to-video",
    reference: "bytedance/seedance-v1.5-pro/text-to-video",
    lipsync: "bytedance/seedance-v1.5-pro/text-to-video",
    edit: "bytedance/seedance-v1.5-pro/text-to-video",
    "motion-control": "bytedance/seedance-v1.5-pro/text-to-video",
    "start-end": "bytedance/seedance-v1.5-pro/image-to-video"
  },
  "wan-2-6": {
    text: "alibaba/wan-2.6/text-to-video",
    image: "alibaba/wan-2.6/image-to-video",
    reference: "alibaba/wan-2.6/text-to-video",
    lipsync: "alibaba/wan-2.6/text-to-video",
    edit: "alibaba/wan-2.6/video-to-video",
    "motion-control": "alibaba/wan-2.6/text-to-video",
    "start-end": "alibaba/wan-2.6/image-to-video"
  },
  "wan-2-2-character-swap": {
    text: "alibaba/wan-2.2/animate-mix",
    image: "alibaba/wan-2.2/animate-mix",
    reference: "alibaba/wan-2.2/animate-mix",
    lipsync: "alibaba/wan-2.2/animate-mix",
    edit: "alibaba/wan-2.2/animate-mix",
    "motion-control": "alibaba/wan-2.2/animate-mix",
    "start-end": "alibaba/wan-2.2/animate-mix"
  },
  "happyhorse-1": {
    text: "alibaba/happyhorse-1.0/text-to-video",
    image: "alibaba/happyhorse-1.0/image-to-video",
    reference: "alibaba/happyhorse-1.0/reference-to-video",
    lipsync: "alibaba/happyhorse-1.0/text-to-video",
    edit: "alibaba/happyhorse-1.0/video-edit",
    "motion-control": "alibaba/happyhorse-1.0/text-to-video",
    "start-end": "alibaba/happyhorse-1.0/image-to-video"
  },
  "wan-2-7": {
    text: "alibaba/wan-2.7/text-to-video",
    image: "alibaba/wan-2.7/image-to-video",
    reference: "alibaba/wan-2.7/reference-to-video",
    lipsync: "alibaba/wan-2.7/text-to-video",
    edit: "alibaba/wan-2.7/video-edit",
    "motion-control": "alibaba/wan-2.7/text-to-video",
    "start-end": "alibaba/wan-2.7/image-to-video"
  },
  "hailuo-2-3": {
    text: "minimax/hailuo-2.3/t2v-pro",
    image: "minimax/hailuo-2.3/i2v-standard",
    reference: "minimax/hailuo-2.3/t2v-pro",
    lipsync: "minimax/hailuo-2.3/t2v-pro",
    edit: "minimax/hailuo-2.3/t2v-pro",
    "motion-control": "minimax/hailuo-2.3/t2v-pro",
    "start-end": "minimax/hailuo-2.3/i2v-standard"
  },
  "google-veo-3-1": {
    text: "google/veo3.1/text-to-video",
    image: "google/veo3.1/image-to-video",
    reference: "google/veo3.1/reference-to-video",
    lipsync: "google/veo3.1/text-to-video",
    edit: "google/veo3.1/text-to-video",
    "motion-control": "google/veo3.1/text-to-video",
    "start-end": "google/veo3.1/image-to-video"
  },
  "vidu-q3": {
    text: "vidu/q3/reference-to-video",
    image: "vidu/q3/reference-to-video",
    reference: "vidu/q3/reference-to-video",
    lipsync: "vidu/q3/reference-to-video",
    edit: "vidu/q3/reference-to-video",
    "motion-control": "vidu/q3/reference-to-video",
    "start-end": "vidu/q3/reference-to-video"
  },
  "vidu-q3-pro": {
    text: "vidu/q3-pro/text-to-video",
    image: "vidu/q3-pro/image-to-video",
    reference: "vidu/q3-pro/text-to-video",
    lipsync: "vidu/q3-pro/text-to-video",
    edit: "vidu/q3-pro/start-end-to-video",
    "motion-control": "vidu/q3-pro/text-to-video",
    "start-end": "vidu/q3-pro/start-end-to-video"
  },
  infinitetalk: {
    text: "atlascloud/infinitetalk",
    image: "atlascloud/infinitetalk",
    reference: "atlascloud/infinitetalk",
    lipsync: "atlascloud/infinitetalk",
    edit: "atlascloud/infinitetalk",
    "motion-control": "atlascloud/infinitetalk",
    "start-end": "atlascloud/infinitetalk"
  },
  "veed-fabric-1": {
    text: "veed/fabric-1.0/image-to-video",
    image: "veed/fabric-1.0/image-to-video",
    reference: "veed/fabric-1.0/image-to-video",
    lipsync: "veed/fabric-1.0/image-to-video",
    edit: "veed/fabric-1.0/image-to-video",
    "motion-control": "veed/fabric-1.0/image-to-video",
    "start-end": "veed/fabric-1.0/image-to-video"
  },
  "veed-fabric-1-fast": {
    text: "veed/fabric-1.0/fast/image-to-video",
    image: "veed/fabric-1.0/fast/image-to-video",
    reference: "veed/fabric-1.0/fast/image-to-video",
    lipsync: "veed/fabric-1.0/fast/image-to-video",
    edit: "veed/fabric-1.0/fast/image-to-video",
    "motion-control": "veed/fabric-1.0/fast/image-to-video",
    "start-end": "veed/fabric-1.0/fast/image-to-video"
  }
};

/** Faster / cheaper Atlas slugs (Seedance *-fast, Kling v3.0 Std). */
const ATLAS_VIDEO_MODEL_FAST_MAP: Partial<Record<string, AtlasModelRow>> = {
  "kling-3-pro": {
    text: "kwaivgi/kling-v3.0-std/text-to-video",
    image: "kwaivgi/kling-v3.0-std/image-to-video",
    reference: "kwaivgi/kling-v3.0-std/text-to-video",
    lipsync: "kwaivgi/kling-v3.0-std/text-to-video",
    edit: "kwaivgi/kling-v3.0-std/text-to-video",
    "motion-control": "kwaivgi/kling-v3.0-std/text-to-video",
    "start-end": "kwaivgi/kling-v3.0-std/image-to-video"
  },
  "kling-2-6-motion": {
    text: "kwaivgi/kling-v2.6-std/motion-control",
    image: "kwaivgi/kling-v2.6-std/motion-control",
    reference: "kwaivgi/kling-v2.6-std/motion-control",
    lipsync: "kwaivgi/kling-v2.6-std/motion-control",
    edit: "kwaivgi/kling-v2.6-std/motion-control",
    "motion-control": "kwaivgi/kling-v2.6-std/motion-control",
    "start-end": "kwaivgi/kling-v2.6-std/motion-control"
  },
  "wan-2-2-character-swap": {
    text: "alibaba/wan-2.2/animate-mix",
    image: "alibaba/wan-2.2/animate-mix",
    reference: "alibaba/wan-2.2/animate-mix",
    lipsync: "alibaba/wan-2.2/animate-mix",
    edit: "alibaba/wan-2.2/animate-mix",
    "motion-control": "alibaba/wan-2.2/animate-mix",
    "start-end": "alibaba/wan-2.2/animate-mix"
  },
  "seedance-2": {
    text: "bytedance/seedance-2.0-fast/text-to-video",
    image: "bytedance/seedance-2.0-fast/image-to-video",
    reference: "bytedance/seedance-2.0-fast/reference-to-video",
    lipsync: "bytedance/seedance-2.0-fast/text-to-video",
    edit: "bytedance/seedance-2.0-fast/text-to-video",
    "motion-control": "bytedance/seedance-2.0-fast/text-to-video",
    "start-end": "bytedance/seedance-2.0-fast/image-to-video"
  },
  "seedance-1-5": {
    text: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    image: "bytedance/seedance-v1.5-pro/image-to-video-fast",
    reference: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    lipsync: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    edit: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    "motion-control": "bytedance/seedance-v1.5-pro/text-to-video-fast",
    "start-end": "bytedance/seedance-v1.5-pro/image-to-video-fast"
  },
  "vidu-q3": {
    text: "vidu/q3/reference-to-video",
    image: "vidu/q3/reference-to-video",
    reference: "vidu/q3-mix/reference-to-video",
    lipsync: "vidu/q3/reference-to-video",
    edit: "vidu/q3/reference-to-video",
    "motion-control": "vidu/q3/reference-to-video",
    "start-end": "vidu/q3/reference-to-video"
  },
  "vidu-q3-pro": {
    text: "vidu/q3-turbo/text-to-video",
    image: "vidu/q3-turbo/image-to-video",
    reference: "vidu/q3-turbo/text-to-video",
    lipsync: "vidu/q3-turbo/text-to-video",
    edit: "vidu/q3-turbo/start-end-to-video",
    "motion-control": "vidu/q3-turbo/text-to-video",
    "start-end": "vidu/q3-turbo/start-end-to-video"
  }
};

export function videoComposerSupportsMotionControl(composerModelId: string): boolean {
  return composerModelId === "kling-2-6-motion";
}

export function videoComposerSupportsWanVideoToVideo(composerModelId: string): boolean {
  return composerModelId === "wan-2-6" || composerModelId === "wan-2-7";
}

export function videoComposerSupportsHappyHorseVideoEdit(composerModelId: string): boolean {
  return composerModelId === "happyhorse-1";
}

export function videoComposerSupportsHappyHorseReference(composerModelId: string): boolean {
  return composerModelId === "happyhorse-1";
}

export function videoComposerSupportsWan27Reference(composerModelId: string): boolean {
  return composerModelId === "wan-2-7";
}

export function videoComposerSupportsVeo31Reference(composerModelId: string): boolean {
  return composerModelId === "google-veo-3-1";
}

export function videoComposerSupportsWan27VideoEdit(composerModelId: string): boolean {
  return composerModelId === "wan-2-7";
}

export function videoComposerSupportsViduStartEnd(composerModelId: string): boolean {
  return composerModelId === "vidu-q3-pro";
}

export const ATLAS_VIDEO_COMPOSER_IDS = Object.keys(ATLAS_VIDEO_MODEL_MAP);

const SPEED_TIER_COMPOSER_IDS = new Set(Object.keys(ATLAS_VIDEO_MODEL_FAST_MAP));

export function isAtlasVideoComposerId(id: string): boolean {
  return id in ATLAS_VIDEO_MODEL_MAP;
}

/** Video studio models excluding Audio-to-Video-only composers. */
export function isGeneralVideoComposerId(id: string): boolean {
  return isAtlasVideoComposerId(id) && !isAudioToVideoComposerId(id);
}

export function videoComposerSupportsSpeedTier(composerModelId: string): boolean {
  return SPEED_TIER_COMPOSER_IDS.has(composerModelId);
}

export function normalizeAtlasVideoSpeedTier(raw: unknown): AtlasVideoSpeedTier {
  if (typeof raw === "string" && raw.trim().toLowerCase() === "fast") {
    return "fast";
  }
  return "standard";
}

export function parseVideoSpeedTierFromUiLabel(label: string): AtlasVideoSpeedTier {
  return normalizeAtlasVideoSpeedTier(label);
}

export function resolveAtlasVideoModelId(
  composerModelId: string,
  action: AtlasVideoRouteAction,
  speedTier: AtlasVideoSpeedTier = "standard"
): string | null {
  const tier: AtlasVideoSpeedTier =
    speedTier === "fast" && videoComposerSupportsSpeedTier(composerModelId)
      ? "fast"
      : "standard";

  const row =
    tier === "fast"
      ? ATLAS_VIDEO_MODEL_FAST_MAP[composerModelId]
      : ATLAS_VIDEO_MODEL_MAP[composerModelId];

  if (!row) return null;
  return row[action] ?? row.text;
}
