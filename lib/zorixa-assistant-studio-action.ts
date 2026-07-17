/**
 * Structured studio actions embedded in assistant replies.
 * Format (fenced block at end of reply):
 *
 * ```zorixa-studio
 * {"type":"video","modelId":"seedance-2","durationSeconds":5,"tab":"Text to Video","prompt":"..."}
 * ```
 */

export type ZorixaStudioAction = {
  type: "video" | "image";
  modelId: string;
  prompt: string;
  durationSeconds?: number;
  tab?: string;
  aspectRatio?: string;
  resolution?: string;
  /** Short reason shown on the recommendation card. */
  why?: string;
  /** 1–5 star rating for the recommendation card. */
  rating?: number;
};

const STUDIO_FENCE_RE = /```zorixa-studio\s*([\s\S]*?)```/i;

export function extractStudioAction(reply: string): {
  displayText: string;
  action: ZorixaStudioAction | null;
} {
  const match = reply.match(STUDIO_FENCE_RE);
  if (!match) {
    return { displayText: reply.trim(), action: null };
  }

  const displayText = reply.replace(STUDIO_FENCE_RE, "").trim();
  let action: ZorixaStudioAction | null = null;
  try {
    const parsed = JSON.parse(match[1]!.trim()) as Partial<ZorixaStudioAction>;
    const type = parsed.type === "image" ? "image" : parsed.type === "video" ? "video" : null;
    const modelId = typeof parsed.modelId === "string" ? parsed.modelId.trim() : "";
    const prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
    if (type && modelId && prompt) {
      const why = typeof parsed.why === "string" ? parsed.why.trim().slice(0, 200) : undefined;
      const ratingRaw =
        typeof parsed.rating === "number" && Number.isFinite(parsed.rating)
          ? Math.round(parsed.rating)
          : undefined;
      action = {
        type,
        modelId,
        prompt: prompt.slice(0, 4000),
        durationSeconds:
          typeof parsed.durationSeconds === "number" && Number.isFinite(parsed.durationSeconds)
            ? Math.max(1, Math.min(30, Math.round(parsed.durationSeconds)))
            : undefined,
        tab: typeof parsed.tab === "string" ? parsed.tab.trim().slice(0, 80) : undefined,
        aspectRatio:
          typeof parsed.aspectRatio === "string" ? parsed.aspectRatio.trim().slice(0, 20) : undefined,
        resolution:
          typeof parsed.resolution === "string" ? parsed.resolution.trim().slice(0, 20) : undefined,
        why: why || undefined,
        rating: ratingRaw && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : undefined
      };
    }
  } catch {
    action = null;
  }

  return { displayText, action };
}

export function buildStudioDeepLink(action: ZorixaStudioAction): string {
  const params = new URLSearchParams();
  if (action.tab) params.set("tab", action.tab);
  params.set("model", action.modelId);
  params.set("prompt", action.prompt);
  if (action.type === "video" && action.durationSeconds) {
    params.set("duration", String(action.durationSeconds));
  }
  if (action.aspectRatio) params.set("aspect", action.aspectRatio);
  if (action.resolution) params.set("resolution", action.resolution);

  const base = action.type === "image" ? "/image" : "/video";
  return `${base}?${params.toString()}`;
}
