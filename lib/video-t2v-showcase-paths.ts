/** Local showcase MP4 under public/ (generated via npm run generate:video-t2v-showcases). */
export function videoT2vShowcaseOutputPath(composerModelId: string): string {
  return `/video-showcases/t2v/${composerModelId}.mp4`;
}

export function videoT2vShowcasePosterPath(composerModelId: string): string {
  return `/tool-previews/text-to-video-${composerModelId}.png`;
}
