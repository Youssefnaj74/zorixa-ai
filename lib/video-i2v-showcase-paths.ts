export function videoI2vShowcaseStartFramePath(composerModelId: string): string {
  return `/video-showcases/i2v/${composerModelId}-start.png`;
}

export function videoI2vShowcaseOutputPath(composerModelId: string): string {
  return `/video-showcases/i2v/${composerModelId}.mp4`;
}

export function videoI2vShowcasePosterPath(composerModelId: string): string {
  return videoI2vShowcaseStartFramePath(composerModelId);
}
