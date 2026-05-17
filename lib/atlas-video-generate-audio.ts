/** Zorixa composer IDs that support Atlas `generate_audio` (native soundtrack). */
const GENERATE_AUDIO_COMPOSER_IDS = new Set([
  "seedance-2",
  "seedance-1-5",
  "kling-3-pro"
]);

export function videoComposerSupportsGenerateAudio(composerModelId: string): boolean {
  return GENERATE_AUDIO_COMPOSER_IDS.has(composerModelId);
}

/** Atlas `model` slug supports native audio synthesis (Seedance, Kling v3, etc.). */
export function atlasModelSupportsGenerateAudio(atlasModelSlug: string): boolean {
  const slug = atlasModelSlug.toLowerCase();
  return /seedance/i.test(slug) || /kling/i.test(slug);
}
