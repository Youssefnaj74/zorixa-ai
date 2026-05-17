/** Zorixa composer IDs that support native soundtrack (Atlas audio flags). */
const GENERATE_AUDIO_COMPOSER_IDS = new Set([
  "seedance-2",
  "seedance-1-5",
  "kling-3-pro"
]);

export function videoComposerSupportsGenerateAudio(composerModelId: string): boolean {
  return GENERATE_AUDIO_COMPOSER_IDS.has(composerModelId);
}

export function isAtlasKlingModelSlug(atlasModelSlug: string): boolean {
  return /kling/i.test(atlasModelSlug);
}

export function isAtlasSeedanceModelSlug(atlasModelSlug: string): boolean {
  return /seedance/i.test(atlasModelSlug);
}

/** Atlas `model` slug supports native audio synthesis (Seedance, Kling v3, etc.). */
export function atlasModelSupportsGenerateAudio(atlasModelSlug: string): boolean {
  return isAtlasKlingModelSlug(atlasModelSlug) || isAtlasSeedanceModelSlug(atlasModelSlug);
}

/**
 * Atlas model families use different request fields:
 * - Seedance: `generate_audio` (omit = often defaults ON for native-audio models)
 * - Kling v3: `sound` (see atlascloud.ai Kling v3.0 Pro docs)
 *
 * Always set explicitly — UI "Audio Off" must send `false`, not omit the field.
 */
export function applyAtlasNativeAudioFields(
  atlasBody: Record<string, unknown>,
  atlasModelSlug: string,
  enabled: boolean
): void {
  if (isAtlasKlingModelSlug(atlasModelSlug)) {
    atlasBody.sound = enabled;
    return;
  }
  if (isAtlasSeedanceModelSlug(atlasModelSlug)) {
    atlasBody.generate_audio = enabled;
  }
}

/** Kling v3 on Atlas only accepts 5s or 10s clip length. */
export function normalizeAtlasKlingDurationSeconds(durationSec: number): 5 | 10 {
  return durationSec >= 8 ? 10 : 5;
}
