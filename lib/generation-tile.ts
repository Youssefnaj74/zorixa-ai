export type GenerationTile = {
  id: string;
  src?: string;
  videoSrc?: string;
  audioSrc?: string;
  title: string;
  kind?: "image" | "video" | "audio";
  categoryLabel?: string;
  creditsSpent: number;
  status: string;
};

/** Strip control chars so RSC/client props stay JSON-safe. */
export function sanitizeHistoryTitle(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
