/**
 * Alibaba Wan 2.7 — text / image / reference / video-edit on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.7/text-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.7/image-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.7/reference-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.7/video-edit
 */

export const WAN_27_COMPOSER_ID = "wan-2-7" as const;

export const WAN_27_DURATION_OPTIONS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
] as const;

/** Reference-to-video duration on Atlas (2–10s). */
export const WAN_27_REFERENCE_DURATION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const WAN_27_ASPECT_OPTIONS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

export const WAN_27_REFERENCE_MAX_IMAGES = 4;

export const WAN_27_REFERENCE_MAX_VIDEOS = 4;

/** Combined image + video reference slots on Atlas R2V. */
export const WAN_27_REFERENCE_MAX_MATERIALS = 5;

/** Single voice-clone audio for Wan R2V (`audio` on Atlas). */
export const WAN_27_REFERENCE_MAX_VOICE_AUDIOS = 1;

/** Optional reference images on video-edit. */
export const WAN_27_VIDEO_EDIT_MAX_IMAGES = 5;

const ATLAS_T2V = "alibaba/wan-2.7/text-to-video";
const ATLAS_I2V = "alibaba/wan-2.7/image-to-video";
const ATLAS_R2V = "alibaba/wan-2.7/reference-to-video";
const ATLAS_V2V = "alibaba/wan-2.7/video-edit";

export type Wan27AtlasAction = "text" | "image" | "reference" | "edit";

export function isWan27ComposerId(id: string): boolean {
  return id === WAN_27_COMPOSER_ID;
}

export function wan27ComposerSupportsReferenceMedia(composerModelId: string): boolean {
  return isWan27ComposerId(composerModelId);
}

export function isWan27AtlasModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/(text-to-video|image-to-video|reference-to-video|video-edit)/i.test(
    model
  );
}

export function isWan27TextToVideoModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/text-to-video/i.test(model);
}

export function isWan27ImageToVideoModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/image-to-video/i.test(model);
}

export function isWan27ReferenceToVideoModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/reference-to-video/i.test(model);
}

export function isWan27VideoEditModel(model: string): boolean {
  return /alibaba\/wan-2\.7\/video-edit/i.test(model);
}

/** Atlas expects 720P / 1080P. */
export function wan27ResolutionFromUi(raw: string): "720P" | "1080P" {
  const v = raw.trim().toLowerCase();
  if (v === "1080p" || v === "1080") return "1080P";
  return "720P";
}

export function wan27AspectFromUi(raw: string): (typeof WAN_27_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return (WAN_27_ASPECT_OPTIONS as readonly string[]).includes(v)
    ? (v as (typeof WAN_27_ASPECT_OPTIONS)[number])
    : "16:9";
}

/** T2V / I2V / V2V — 2–15 seconds. */
export function normalizeWan27DurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(2, Math.round(raw)));
}

/** R2V — 2–10 seconds on Atlas. */
export function normalizeWan27ReferenceDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.min(10, Math.max(2, Math.round(raw)));
}

/**
 * Atlas Wan 2.7 ships with built-in soundtrack; default ON unless client sends `generate_audio: false`.
 */
export function resolveWan27GenerateAudioFlag(raw: boolean | undefined): boolean {
  return raw !== false;
}

function sliceWan27ReferenceMaterials(images: string[], videos: string[]): {
  images: string[];
  videos: string[];
} {
  let imgs = images.slice(0, WAN_27_REFERENCE_MAX_IMAGES);
  let vids = videos.slice(0, WAN_27_REFERENCE_MAX_VIDEOS);
  while (imgs.length + vids.length > WAN_27_REFERENCE_MAX_MATERIALS) {
    if (vids.length > imgs.length) {
      vids = vids.slice(0, -1);
    } else {
      imgs = imgs.slice(0, -1);
    }
  }
  return { images: imgs, videos: vids };
}

export function buildWan27TextAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    aspect_ratio: wan27AspectFromUi(input.aspectRatio),
    resolution: wan27ResolutionFromUi(input.resolution),
    duration: normalizeWan27DurationSeconds(input.durationSec),
    fps: 24
  };
  applyWan27GenerateAudio(body, input.generateAudio ?? true);
  return body;
}

function applyWan27GenerateAudio(
  body: Record<string, unknown>,
  generateAudio: boolean | undefined
): void {
  if (generateAudio === true) body.generate_audio = true;
  else if (generateAudio === false) body.generate_audio = false;
}

export function buildWan27ImageAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  imageUrl: string;
  lastImageUrl?: string;
  drivingAudioUrl?: string;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    aspect_ratio: wan27AspectFromUi(input.aspectRatio),
    resolution: wan27ResolutionFromUi(input.resolution),
    duration: normalizeWan27DurationSeconds(input.durationSec),
    image: input.imageUrl,
    image_url: input.imageUrl,
    fps: 24
  };
  if (input.lastImageUrl) {
    body.last_image = input.lastImageUrl;
    body.lastImage = input.lastImageUrl;
  }
  if (input.drivingAudioUrl) {
    body.audio = input.drivingAudioUrl;
    body.audio_url = input.drivingAudioUrl;
  }
  applyWan27GenerateAudio(body, input.generateAudio ?? true);
  return body;
}

export function buildWan27ReferenceAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  images: string[];
  videos: string[];
  voiceAudioUrl?: string;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const { images, videos } = sliceWan27ReferenceMaterials(input.images, input.videos);
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    ratio: wan27AspectFromUi(input.aspectRatio),
    resolution: wan27ResolutionFromUi(input.resolution),
    duration: normalizeWan27ReferenceDurationSeconds(input.durationSec),
    fps: 24
  };
  if (images.length > 0) body.images = images;
  if (videos.length > 0) body.videos = videos;
  if (input.voiceAudioUrl) {
    body.audio = input.voiceAudioUrl;
    body.reference_voice = input.voiceAudioUrl;
  }
  applyWan27GenerateAudio(body, input.generateAudio ?? true);
  return body;
}

export function buildWan27VideoEditAtlasBody(input: {
  model: string;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSec: number;
  videoUrl: string;
  referenceImages?: string[];
  generateAudio?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    video: input.videoUrl,
    video_url: input.videoUrl,
    ratio: wan27AspectFromUi(input.aspectRatio),
    resolution: wan27ResolutionFromUi(input.resolution),
    duration: normalizeWan27DurationSeconds(input.durationSec),
    fps: 24
  };
  const refs = (input.referenceImages ?? []).slice(0, WAN_27_VIDEO_EDIT_MAX_IMAGES);
  if (refs.length === 1) {
    body.image = refs[0];
  } else if (refs.length > 1) {
    body.images = refs;
  }
  applyWan27GenerateAudio(body, input.generateAudio);
  return body;
}

export function resolveWan27AtlasSlug(action: Wan27AtlasAction): string {
  switch (action) {
    case "image":
      return ATLAS_I2V;
    case "reference":
      return ATLAS_R2V;
    case "edit":
      return ATLAS_V2V;
    default:
      return ATLAS_T2V;
  }
}
