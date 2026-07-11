export function videoV2vShowcaseCharacterPath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-character.png`;
}

export function videoV2vShowcaseMotionClipPath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-motion.mp4`;
}

export function videoV2vShowcaseOutputPath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}.mp4`;
}

export function videoV2vShowcasePosterPath(composerModelId: string): string {
  return videoV2vShowcaseCharacterPath(composerModelId);
}
