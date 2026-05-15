/** Zorixa composer IDs that support Atlas `generate_audio` (native soundtrack). */
const GENERATE_AUDIO_COMPOSER_IDS = new Set(["seedance-2", "seedance-1-5"]);

export function videoComposerSupportsGenerateAudio(composerModelId: string): boolean {
  return GENERATE_AUDIO_COMPOSER_IDS.has(composerModelId);
}

/** Atlas `model` slug supports native audio synthesis (Seedance family). */
export function atlasModelSupportsGenerateAudio(atlasModelSlug: string): boolean {
  return /seedance/i.test(atlasModelSlug);
}
