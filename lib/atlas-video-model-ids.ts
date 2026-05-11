/**
 * Maps Zorixa video composer IDs → Atlas Cloud `generateVideo` `model` slugs.
 * Slugs follow Atlas model library paths (see atlascloud.ai/models).
 */
export type AtlasVideoRouteAction = "text" | "image" | "lipsync" | "edit";

type AtlasModelRow = Record<AtlasVideoRouteAction, string>;

export const ATLAS_VIDEO_MODEL_MAP: Record<string, AtlasModelRow> = {
  "kling-3-pro": {
    text: "kwaivgi/kling-v3.0-pro/text-to-video",
    image: "kwaivgi/kling-v3.0-pro/image-to-video",
    lipsync: "kwaivgi/kling-v3.0-pro/text-to-video",
    edit: "kwaivgi/kling-v3.0-pro/text-to-video"
  },
  "seedance-2": {
    text: "bytedance/seedance-2.0/text-to-video",
    image: "bytedance/seedance-2.0/image-to-video",
    lipsync: "bytedance/seedance-2.0/text-to-video",
    edit: "bytedance/seedance-2.0/text-to-video"
  },
  "seedance-1-5": {
    text: "bytedance/seedance-v1.5-pro/text-to-video",
    image: "bytedance/seedance-v1.5-pro/image-to-video",
    lipsync: "bytedance/seedance-v1.5-pro/text-to-video",
    edit: "bytedance/seedance-v1.5-pro/text-to-video"
  },
  "wan-2-6": {
    text: "alibaba/wan-2.6/text-to-video",
    image: "alibaba/wan-2.6/image-to-video",
    lipsync: "alibaba/wan-2.6/text-to-video",
    edit: "alibaba/wan-2.6/text-to-video"
  },
  "hailuo-2-3": {
    text: "minimax/hailuo-2.3/t2v-pro",
    image: "minimax/hailuo-2.3/i2v-standard",
    lipsync: "minimax/hailuo-2.3/t2v-pro",
    edit: "minimax/hailuo-2.3/t2v-pro"
  },
  "google-veo-3-1": {
    text: "google/veo3.1/text-to-video",
    image: "google/veo3.1/image-to-video",
    lipsync: "google/veo3.1/text-to-video",
    edit: "google/veo3.1/text-to-video"
  }
};

export const ATLAS_VIDEO_COMPOSER_IDS = Object.keys(ATLAS_VIDEO_MODEL_MAP);

export function isAtlasVideoComposerId(id: string): boolean {
  return id in ATLAS_VIDEO_MODEL_MAP;
}

export function resolveAtlasVideoModelId(
  composerModelId: string,
  action: AtlasVideoRouteAction
): string | null {
  const row = ATLAS_VIDEO_MODEL_MAP[composerModelId];
  if (!row) return null;
  return row[action] ?? row.text;
}
