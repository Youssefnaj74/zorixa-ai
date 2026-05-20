/**
 * Atlas Cloud Audio-to-Video composers (portrait + audio → talking video).
 * @see https://www.atlascloud.ai/models/atlascloud/infinitetalk
 * @see https://www.atlascloud.ai/models/veed/fabric-1.0/image-to-video
 */

export const INFINITETALK_COMPOSER_ID = "infinitetalk" as const;
export const VEED_FABRIC_1_COMPOSER_ID = "veed-fabric-1" as const;
export const VEED_FABRIC_1_FAST_COMPOSER_ID = "veed-fabric-1-fast" as const;

export const AUDIO_TO_VIDEO_COMPOSER_IDS = [
  INFINITETALK_COMPOSER_ID,
  VEED_FABRIC_1_COMPOSER_ID,
  VEED_FABRIC_1_FAST_COMPOSER_ID
] as const;

export type AudioToVideoComposerId = (typeof AUDIO_TO_VIDEO_COMPOSER_IDS)[number];

const A2V_SET = new Set<string>(AUDIO_TO_VIDEO_COMPOSER_IDS);

const ATLAS_SLUG_BY_COMPOSER: Record<AudioToVideoComposerId, string> = {
  [INFINITETALK_COMPOSER_ID]: "atlascloud/infinitetalk",
  [VEED_FABRIC_1_COMPOSER_ID]: "veed/fabric-1.0/image-to-video",
  [VEED_FABRIC_1_FAST_COMPOSER_ID]: "veed/fabric-1.0/fast/image-to-video"
};

export function isAudioToVideoComposerId(id: string): boolean {
  return A2V_SET.has(id);
}

export function isAudioToVideoAtlasModelSlug(model: string): boolean {
  return (
    /atlascloud\/infinitetalk/i.test(model) ||
    /veed\/fabric-1\.0/i.test(model)
  );
}

export function resolveAudioToVideoAtlasSlug(composerId: string): string | null {
  if (!isAudioToVideoComposerId(composerId)) return null;
  return ATLAS_SLUG_BY_COMPOSER[composerId as AudioToVideoComposerId];
}

export const AUDIO_TO_VIDEO_RESOLUTIONS = ["480p", "720p"] as const;
export type AudioToVideoResolution = (typeof AUDIO_TO_VIDEO_RESOLUTIONS)[number];

export const DEFAULT_AUDIO_TO_VIDEO_RESOLUTION: AudioToVideoResolution = "720p";

/** Atlas Audio-to-Video models — 480p / 720p only (see Atlas playground). */
export const AUDIO_TO_VIDEO_RESOLUTION_OPTIONS = [
  { id: "480p" as const, label: "480p", newBadge: false },
  { id: "720p" as const, label: "720p", newBadge: false }
] as const;

const A2V_RESOLUTION_SET = new Set<string>(AUDIO_TO_VIDEO_RESOLUTIONS);

export function isAudioToVideoResolution(raw: string): raw is AudioToVideoResolution {
  return A2V_RESOLUTION_SET.has(raw.trim().toLowerCase());
}

/** InfiniteTalk + VEED Fabric support 480p / 720p only. */
export function normalizeAudioToVideoResolution(raw: string): AudioToVideoResolution {
  const v = raw.trim().toLowerCase();
  if (v === "480p") return "480p";
  return DEFAULT_AUDIO_TO_VIDEO_RESOLUTION;
}

export function buildAudioToVideoAtlasBody(input: {
  model: string;
  prompt: string;
  image_url: string;
  audio_url: string;
  resolution: string;
}): Record<string, unknown> {
  const resolution = normalizeAudioToVideoResolution(input.resolution);
  return {
    model: input.model,
    prompt: input.prompt,
    image_url: input.image_url,
    image: input.image_url,
    audio_url: input.audio_url,
    audio: input.audio_url,
    resolution
  };
}
