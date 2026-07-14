/** Atlas Seedance 2.0 reference-to-video — request helpers. */

/** Atlas Seedance 2.0 reference-to-video accepts up to 9 `reference_images`. */
export const SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES = 9;

/** Atlas Seedance 2.0 reference-to-video accepts up to 3 `reference_videos`. */
export const SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS = 3;

/** Atlas Seedance 2.0 reference-to-video accepts up to 3 `reference_audios`. */
export const SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS = 3;

export function seedanceComposerSupportsReferenceMedia(composerModelId: string): boolean {
  return composerModelId === "seedance-2";
}

const R2V_RATIOS = new Set(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]);

export function isSeedanceReferenceToVideoModel(model: string): boolean {
  return /seedance/i.test(model) && /reference-to-video/i.test(model);
}

/** Atlas R2V accepts 4–15 seconds (or -1 auto; we send explicit 4–15). */
export function normalizeSeedanceReferenceDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(4, Math.round(raw)));
}

/** UI aspect label → Atlas `ratio` param. */
export function uiAspectToAtlasRatio(aspectRatio: string): string {
  const v = aspectRatio.trim();
  return R2V_RATIOS.has(v) ? v : "9:16";
}

/** Atlas Fast R2V has no native `1080p` / `4k` (only 720p + *-SR tiers). */
export function isSeedanceFastReferenceModel(model: string): boolean {
  return /seedance-2\.0-fast\/reference-to-video/i.test(model);
}

/**
 * Map UI resolution → Atlas R2V `resolution`.
 * Standard: 720p | 1080p | 4k (480p forced up for R2V).
 * Fast: 720p only among our UI tiers (Atlas Fast enum rejects native 1080p/4k).
 */
export function normalizeSeedanceReferenceResolution(
  raw: string,
  modelOrFast?: string | boolean
): string {
  const v = raw.trim().toLowerCase();
  const isFast =
    typeof modelOrFast === "boolean"
      ? modelOrFast
      : typeof modelOrFast === "string"
        ? isSeedanceFastReferenceModel(modelOrFast)
        : false;

  if (v === "480p") return "720p";
  if (isFast) {
    // Atlas `seedance-2.0-fast/reference-to-video`: 480p | 720p | 720p-SR | 1080p-SR | 1440p-SR
    return "720p";
  }
  if (v === "4k" || v === "2160p") return "4k";
  return v === "1080p" || v === "720p" ? v : "720p";
}

export function buildSeedanceReferenceAtlasBody(input: {
  model: string;
  prompt: string;
  reference_images: string[];
  reference_videos?: string[];
  reference_audios?: string[];
  durationSec: number;
  resolution: string;
  aspectRatio: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    duration: normalizeSeedanceReferenceDurationSeconds(input.durationSec),
    resolution: normalizeSeedanceReferenceResolution(input.resolution, input.model),
    ratio: uiAspectToAtlasRatio(input.aspectRatio)
  };
  const images = input.reference_images.slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_IMAGES);
  if (images.length > 0) body.reference_images = images;
  const videos = (input.reference_videos ?? []).slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS);
  if (videos.length > 0) body.reference_videos = videos;
  const audios = (input.reference_audios ?? []).slice(0, SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS);
  if (audios.length > 0) body.reference_audios = audios;
  return body;
}
