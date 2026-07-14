/** Atlas Vidu Q3 / Q3-Pro / Q3-Mix video helpers. */

/** Reference-to-Video tab — Atlas `vidu/q3/reference-to-video` (+ Fast → `vidu/q3-mix/...`). */
export const VIDU_Q3_COMPOSER_ID = "vidu-q3" as const;

/** T2V, I2V, Start-End — Atlas `vidu/q3-pro/*` (+ turbo via speed tier). */
export const VIDU_Q3_PRO_COMPOSER_ID = "vidu-q3-pro" as const;

/** Atlas Vidu Q3 / Q3-Mix R2V accepts 1–4 `images`. */
export const VIDU_Q3_REFERENCE_TO_VIDEO_MAX_IMAGES = 4;

export const VIDU_Q3_ASPECT_OPTIONS = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

export function isViduQ3ComposerId(composerModelId: string): boolean {
  return composerModelId === VIDU_Q3_COMPOSER_ID;
}

export function isViduQ3ProComposerId(composerModelId: string): boolean {
  return composerModelId === VIDU_Q3_PRO_COMPOSER_ID;
}

export function isViduReferenceComposerId(composerModelId: string): boolean {
  return isViduQ3ComposerId(composerModelId);
}

export function isViduAtlasModelSlug(model: string): boolean {
  return /vidu/i.test(model);
}

export function isViduReferenceToVideoModel(model: string): boolean {
  return isViduAtlasModelSlug(model) && /reference-to-video/i.test(model);
}

export function isViduQ3MixReferenceModel(model: string): boolean {
  return /vidu\/q3-mix\/reference-to-video/i.test(model);
}

export function isViduStartEndToVideoModel(model: string): boolean {
  return isViduAtlasModelSlug(model) && /start-end-to-video/i.test(model);
}

/** Atlas Vidu Q3-Pro accepts 1–16 seconds (T2V / I2V / start-end). */
export function normalizeViduDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(16, Math.max(1, Math.round(raw)));
}

/**
 * Atlas Q3 R2V duration is 3–16s; Q3-Mix R2V allows 1–16s.
 * @see https://www.atlascloud.ai/models/vidu/q3/reference-to-video
 * @see https://www.atlascloud.ai/models/vidu/q3-mix/reference-to-video
 */
export function normalizeViduReferenceDurationSeconds(
  raw: unknown,
  atlasModelSlug?: string
): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  const min = isViduQ3MixReferenceModel(atlasModelSlug ?? "") ? 1 : 3;
  return Math.min(16, Math.max(min, Math.round(raw)));
}

/** Atlas Vidu default soundtrack ON unless client sends false. */
export function resolveViduGenerateAudioFlag(raw: boolean | undefined): boolean {
  return raw !== false;
}

export function viduAspectFromUi(raw: string): (typeof VIDU_Q3_ASPECT_OPTIONS)[number] {
  const v = raw.trim();
  return (VIDU_Q3_ASPECT_OPTIONS as readonly string[]).includes(v)
    ? (v as (typeof VIDU_Q3_ASPECT_OPTIONS)[number])
    : "16:9";
}

/** Atlas Vidu Q3-Pro / Q3 / Mix R2V — 540p, 720p, 1080p (no 480p). */
export const VIDU_Q3_PRO_RESOLUTION_OPTIONS = [
  { id: "1080p" as const, label: "1080p", newBadge: true },
  { id: "720p" as const, label: "720p", newBadge: false },
  { id: "540p" as const, label: "540p", newBadge: false }
] as const;

export const VIDU_Q3_REFERENCE_RESOLUTION_OPTIONS = VIDU_Q3_PRO_RESOLUTION_OPTIONS;

export function viduQ3ProResolutionFromUi(raw: string): "540p" | "720p" | "1080p" {
  const v = raw.trim().toLowerCase();
  if (v === "1080p" || v === "1080") return "1080p";
  if (v === "540p" || v === "540" || v === "480p") return "540p";
  return "720p";
}

/**
 * Atlas Vidu R2V body — `images` (not `reference_images`), no `fps`.
 * @see https://www.atlascloud.ai/models/vidu/q3/reference-to-video
 */
export function buildViduReferenceAtlasBody(input: {
  model: string;
  prompt: string;
  images: string[];
  durationSec: number;
  aspectRatio: string;
  resolution: string;
  generateAudio?: boolean;
}): Record<string, unknown> {
  const images = input.images.slice(0, VIDU_Q3_REFERENCE_TO_VIDEO_MAX_IMAGES);
  return {
    model: input.model,
    prompt: input.prompt,
    images,
    duration: normalizeViduReferenceDurationSeconds(input.durationSec, input.model),
    resolution: viduQ3ProResolutionFromUi(input.resolution),
    aspect_ratio: viduAspectFromUi(input.aspectRatio),
    generate_audio: resolveViduGenerateAudioFlag(input.generateAudio)
  };
}
