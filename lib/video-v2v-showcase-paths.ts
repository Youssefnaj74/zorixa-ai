export function videoV2vShowcaseSourcePath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-source.mp4`;
}

export function videoV2vShowcaseCharacterPath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-character.png`;
}

export function videoV2vShowcaseMotionClipPath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-motion.mp4`;
}

export function videoV2vShowcaseOutputPath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}.mp4`;
}

export function videoV2vShowcaseReferenceImagePath(composerModelId: string, index = 1): string {
  return `/video-showcases/v2v/${composerModelId}-ref-${index}.png`;
}

export function videoV2vShowcaseStartFramePath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-start.png`;
}

export function videoV2vShowcaseEndFramePath(composerModelId: string): string {
  return `/video-showcases/v2v/${composerModelId}-end.png`;
}

export function videoV2vShowcasePosterPath(composerModelId: string): string {
  if (composerModelId === "wan-2-6" || composerModelId === "wan-2-7" || composerModelId === "happyhorse-1") {
    return `/video-showcases/v2v/${composerModelId}-poster.png`;
  }
  if (composerModelId === "vidu-q3-pro") {
    return videoV2vShowcaseStartFramePath(composerModelId);
  }
  return videoV2vShowcaseCharacterPath(composerModelId);
}
