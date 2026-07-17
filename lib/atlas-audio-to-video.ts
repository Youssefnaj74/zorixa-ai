/**
 * Atlas Cloud Audio-to-Video composers (portrait + audio → talking video).
 * @see https://www.atlascloud.ai/models/atlascloud/infinitetalk
 * @see https://www.atlascloud.ai/models/veed/fabric-1.0/image-to-video
 * @see https://www.atlascloud.ai/models/bytedance/avatar-omni-human-v1.5
 */

export const INFINITETALK_COMPOSER_ID = "infinitetalk" as const;
export const VEED_FABRIC_1_COMPOSER_ID = "veed-fabric-1" as const;
export const VEED_FABRIC_1_FAST_COMPOSER_ID = "veed-fabric-1-fast" as const;
export const OMNI_HUMAN_15_COMPOSER_ID = "omni-human-1-5" as const;

export const AUDIO_TO_VIDEO_COMPOSER_IDS = [
  INFINITETALK_COMPOSER_ID,
  VEED_FABRIC_1_COMPOSER_ID,
  VEED_FABRIC_1_FAST_COMPOSER_ID,
  OMNI_HUMAN_15_COMPOSER_ID
] as const;

export type AudioToVideoComposerId = (typeof AUDIO_TO_VIDEO_COMPOSER_IDS)[number];

const A2V_SET = new Set<string>(AUDIO_TO_VIDEO_COMPOSER_IDS);

const ATLAS_SLUG_BY_COMPOSER: Record<AudioToVideoComposerId, string> = {
  [INFINITETALK_COMPOSER_ID]: "atlascloud/infinitetalk",
  [VEED_FABRIC_1_COMPOSER_ID]: "veed/fabric-1.0/image-to-video",
  [VEED_FABRIC_1_FAST_COMPOSER_ID]: "veed/fabric-1.0/fast/image-to-video",
  [OMNI_HUMAN_15_COMPOSER_ID]: "bytedance/avatar-omni-human-v1.5"
};

export function isAudioToVideoComposerId(id: string): boolean {
  return A2V_SET.has(id);
}

export function isAudioToVideoAtlasModelSlug(model: string): boolean {
  return (
    /atlascloud\/infinitetalk/i.test(model) ||
    /veed\/fabric-1\.0/i.test(model) ||
    /bytedance\/avatar-omni-human/i.test(model)
  );
}

export function resolveAudioToVideoAtlasSlug(composerId: string): string | null {
  if (!isAudioToVideoComposerId(composerId)) return null;
  return ATLAS_SLUG_BY_COMPOSER[composerId as AudioToVideoComposerId];
}

export const AUDIO_TO_VIDEO_RESOLUTIONS = ["480p", "720p", "1080p"] as const;
export type AudioToVideoResolution = (typeof AUDIO_TO_VIDEO_RESOLUTIONS)[number];

export const DEFAULT_AUDIO_TO_VIDEO_RESOLUTION: AudioToVideoResolution = "720p";

/** OmniHuman 1.5 runs at 720p / 1080p (unlike InfiniteTalk / VEED which are 480p / 720p). */
export function isOmniHumanAudioToVideoComposer(id: string): boolean {
  return id === OMNI_HUMAN_15_COMPOSER_ID || /avatar-omni-human/i.test(id);
}

export type AudioToVideoResolutionOption = {
  id: AudioToVideoResolution;
  label: string;
  newBadge: boolean;
};

/** InfiniteTalk / VEED Fabric — 480p / 720p only (see Atlas playground). */
export const AUDIO_TO_VIDEO_RESOLUTION_OPTIONS: AudioToVideoResolutionOption[] = [
  { id: "480p", label: "480p", newBadge: false },
  { id: "720p", label: "720p", newBadge: false }
];

/** OmniHuman 1.5 — 720p / 1080p only. */
export const OMNI_HUMAN_RESOLUTION_OPTIONS: AudioToVideoResolutionOption[] = [
  { id: "720p", label: "720p", newBadge: false },
  { id: "1080p", label: "1080p", newBadge: false }
];

/** Resolution choices for the given Audio-to-Video composer. */
export function audioToVideoResolutionOptions(
  composerId: string
): AudioToVideoResolutionOption[] {
  return isOmniHumanAudioToVideoComposer(composerId)
    ? OMNI_HUMAN_RESOLUTION_OPTIONS
    : AUDIO_TO_VIDEO_RESOLUTION_OPTIONS;
}

const A2V_RESOLUTION_SET = new Set<string>(AUDIO_TO_VIDEO_RESOLUTIONS);

export function isAudioToVideoResolution(raw: string): raw is AudioToVideoResolution {
  return A2V_RESOLUTION_SET.has(raw.trim().toLowerCase());
}

/** Clamp a resolution to what the given composer supports (OmniHuman: 720p/1080p, others: 480p/720p). */
export function normalizeAudioToVideoResolution(
  raw: string,
  composerId?: string
): AudioToVideoResolution {
  const v = raw.trim().toLowerCase();
  if (composerId && isOmniHumanAudioToVideoComposer(composerId)) {
    return v === "1080p" ? "1080p" : "720p";
  }
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
  const resolution = normalizeAudioToVideoResolution(input.resolution, input.model);
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    image_url: input.image_url,
    image: input.image_url,
    audio_url: input.audio_url,
    audio: input.audio_url,
    resolution
  };
  // OmniHuman 1.5 expects an integer output_resolution (720 | 1080) rather than
  // the "480p"/"720p" string the other A2V models use.
  if (isOmniHumanAudioToVideoComposer(input.model)) {
    body.output_resolution = resolution === "1080p" ? 1080 : 720;
  }
  return body;
}
