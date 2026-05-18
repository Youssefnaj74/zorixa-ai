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
  | "motion-control";

export type AtlasVideoSpeedTier = "standard" | "fast";

type AtlasModelRow = Record<AtlasVideoRouteAction, string>;

/** Default (quality) tier — Pro for Kling, full Seedance 2.0, etc. */
export const ATLAS_VIDEO_MODEL_MAP: Record<string, AtlasModelRow> = {
  "kling-3-pro": {
    text: "kwaivgi/kling-v3.0-pro/text-to-video",
    image: "kwaivgi/kling-v3.0-pro/image-to-video",
    reference: "kwaivgi/kling-v3.0-pro/text-to-video",
    lipsync: "kwaivgi/kling-v3.0-pro/text-to-video",
    edit: "kwaivgi/kling-v3.0-pro/text-to-video",
    "motion-control": "kwaivgi/kling-v3.0-pro/text-to-video"
  },
  "kling-2-6-motion": {
    text: "kwaivgi/kling-v2.6-pro/motion-control",
    image: "kwaivgi/kling-v2.6-pro/motion-control",
    reference: "kwaivgi/kling-v2.6-pro/motion-control",
    lipsync: "kwaivgi/kling-v2.6-pro/motion-control",
    edit: "kwaivgi/kling-v2.6-pro/motion-control",
    "motion-control": "kwaivgi/kling-v2.6-pro/motion-control"
  },
  "seedance-2": {
    text: "bytedance/seedance-2.0/text-to-video",
    image: "bytedance/seedance-2.0/image-to-video",
    reference: "bytedance/seedance-2.0/reference-to-video",
    lipsync: "bytedance/seedance-2.0/text-to-video",
    edit: "bytedance/seedance-2.0/text-to-video",
    "motion-control": "bytedance/seedance-2.0/text-to-video"
  },
  "seedance-1-5": {
    text: "bytedance/seedance-v1.5-pro/text-to-video",
    image: "bytedance/seedance-v1.5-pro/image-to-video",
    reference: "bytedance/seedance-v1.5-pro/text-to-video",
    lipsync: "bytedance/seedance-v1.5-pro/text-to-video",
    edit: "bytedance/seedance-v1.5-pro/text-to-video",
    "motion-control": "bytedance/seedance-v1.5-pro/text-to-video"
  },
  "wan-2-6": {
    text: "alibaba/wan-2.6/text-to-video",
    image: "alibaba/wan-2.6/image-to-video",
    reference: "alibaba/wan-2.6/text-to-video",
    lipsync: "alibaba/wan-2.6/text-to-video",
    edit: "alibaba/wan-2.6/video-to-video",
    "motion-control": "alibaba/wan-2.6/text-to-video"
  },
  "hailuo-2-3": {
    text: "minimax/hailuo-2.3/t2v-pro",
    image: "minimax/hailuo-2.3/i2v-standard",
    reference: "minimax/hailuo-2.3/t2v-pro",
    lipsync: "minimax/hailuo-2.3/t2v-pro",
    edit: "minimax/hailuo-2.3/t2v-pro",
    "motion-control": "minimax/hailuo-2.3/t2v-pro"
  },
  "google-veo-3-1": {
    text: "google/veo3.1/text-to-video",
    image: "google/veo3.1/image-to-video",
    reference: "google/veo3.1/text-to-video",
    lipsync: "google/veo3.1/text-to-video",
    edit: "google/veo3.1/text-to-video",
    "motion-control": "google/veo3.1/text-to-video"
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
    "motion-control": "kwaivgi/kling-v3.0-std/text-to-video"
  },
  "kling-2-6-motion": {
    text: "kwaivgi/kling-v2.6-std/motion-control",
    image: "kwaivgi/kling-v2.6-std/motion-control",
    reference: "kwaivgi/kling-v2.6-std/motion-control",
    lipsync: "kwaivgi/kling-v2.6-std/motion-control",
    edit: "kwaivgi/kling-v2.6-std/motion-control",
    "motion-control": "kwaivgi/kling-v2.6-std/motion-control"
  },
  "seedance-2": {
    text: "bytedance/seedance-2.0-fast/text-to-video",
    image: "bytedance/seedance-2.0-fast/image-to-video",
    reference: "bytedance/seedance-2.0-fast/reference-to-video",
    lipsync: "bytedance/seedance-2.0-fast/text-to-video",
    edit: "bytedance/seedance-2.0-fast/text-to-video",
    "motion-control": "bytedance/seedance-2.0-fast/text-to-video"
  },
  "seedance-1-5": {
    text: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    image: "bytedance/seedance-v1.5-pro/image-to-video-fast",
    reference: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    lipsync: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    edit: "bytedance/seedance-v1.5-pro/text-to-video-fast",
    "motion-control": "bytedance/seedance-v1.5-pro/text-to-video-fast"
  }
};

export function videoComposerSupportsMotionControl(composerModelId: string): boolean {
  return composerModelId === "kling-2-6-motion";
}

export function videoComposerSupportsWanVideoToVideo(composerModelId: string): boolean {
  return composerModelId === "wan-2-6";
}

export const ATLAS_VIDEO_COMPOSER_IDS = Object.keys(ATLAS_VIDEO_MODEL_MAP);

const SPEED_TIER_COMPOSER_IDS = new Set(Object.keys(ATLAS_VIDEO_MODEL_FAST_MAP));

export function isAtlasVideoComposerId(id: string): boolean {
  return id in ATLAS_VIDEO_MODEL_MAP;
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
