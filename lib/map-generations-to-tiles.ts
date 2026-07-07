import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import type { GenerationTile } from "@/lib/generation-tile";
import { sanitizeHistoryTitle } from "@/lib/generation-tile";
import {
  isUsableVideoHistoryPoster
} from "@/lib/history-media-url";
import { isTtsGenerationRow } from "@/lib/tts-generation-shared";

export type GenerationHistoryRow = {
  id: number;
  feature_type: "image" | "video";
  input_url: string;
  output_url: string | null;
  status: string;
  created_at: string;
  provider?: string | null;
  composer_model_id?: string | null;
  prompt?: string | null;
  credits_spent?: number | null;
};

function dedupeGenerationsByOutput(items: GenerationHistoryRow[]): GenerationHistoryRow[] {
  const seen = new Set<string>();
  const out: GenerationHistoryRow[] = [];
  for (const g of items) {
    const key = (g.output_url?.trim() || `id:${g.id}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}

function historyTitle(g: GenerationHistoryRow, modelLabel: string): string {
  const prompt = g.prompt?.trim();
  if (prompt) {
    const clipped = prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt;
    return sanitizeHistoryTitle(clipped);
  }
  const base = g.status === "completed" ? modelLabel : `${modelLabel} (${g.status})`;
  return sanitizeHistoryTitle(base);
}

function tileFromRow(
  g: GenerationHistoryRow,
  title: string,
  partial: Omit<GenerationTile, "id" | "title" | "creditsSpent" | "status">
): GenerationTile {
  return {
    id: String(g.id),
    title,
    creditsSpent: Math.max(0, Math.round(g.credits_spent ?? 0)),
    status: g.status,
    ...partial
  };
}

export function mapGenerationsToTiles(items: GenerationHistoryRow[]): GenerationTile[] {
  return dedupeGenerationsByOutput(items).map((g) => {
    const modelLabel = composerModelDisplayLabel(
      g.composer_model_id,
      g.feature_type,
      g.provider
    );
    const title = historyTitle(g, modelLabel);

    if (isTtsGenerationRow(g)) {
      return tileFromRow(g, title, {
        kind: "audio",
        audioSrc: g.output_url?.trim() || undefined,
        categoryLabel: "Text to Speech - Zorixa AI"
      });
    }

    if (g.feature_type === "video") {
      const out = g.output_url;
      const inn = g.input_url;
      const videoSrc = out?.trim() ? out : undefined;
      let src: string | undefined;
      if (out && isUsableVideoHistoryPoster(out)) src = out;
      else if (isUsableVideoHistoryPoster(inn)) src = inn;

      return tileFromRow(g, title, {
        kind: "video",
        src,
        videoSrc,
        categoryLabel: "Zorixa AI"
      });
    }

    const out = g.output_url;
    const inn = g.input_url;
    const src = out ?? (inn && !inn.includes("placehold.co") ? inn : undefined);
    return tileFromRow(g, title, {
      kind: "image",
      src,
      categoryLabel: "Zorixa AI"
    });
  });
}
