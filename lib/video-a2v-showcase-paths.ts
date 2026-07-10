export function videoA2vShowcasePortraitPath(composerModelId: string): string {
  return `/video-showcases/a2v/${composerModelId}-portrait.png`;
}

export function videoA2vShowcaseAudioPath(composerModelId: string): string {
  return `/video-showcases/a2v/${composerModelId}-audio.mp3`;
}

export function videoA2vShowcaseOutputPath(composerModelId: string): string {
  return `/video-showcases/a2v/${composerModelId}.mp4`;
}

export function videoA2vShowcasePosterPath(composerModelId: string): string {
  return videoA2vShowcasePortraitPath(composerModelId);
}
