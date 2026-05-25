import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GenerationGrid, type GenerationTile } from "@/components/dashboard/GenerationGrid";
import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import { isTtsGenerationRow } from "@/lib/tts-generation-shared";

type GenerationRow = {
  id: number;
  feature_type: "image" | "video";
  input_url: string;
  output_url: string | null;
  status: string;
  created_at: string;
  provider?: string | null;
  composer_model_id?: string | null;
  prompt?: string | null;
};

function isLikelyVideoFile(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return [".mp4", ".webm", ".mov", ".m4v"].some((ext) => path.endsWith(ext));
}

function dedupeGenerationsByOutput(items: GenerationRow[]): GenerationRow[] {
  const seen = new Set<string>();
  const out: GenerationRow[] = [];
  for (const g of items) {
    const key = (g.output_url?.trim() || `id:${g.id}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}

function historyTitle(g: GenerationRow, modelLabel: string): string {
  const prompt = g.prompt?.trim();
  if (prompt) return prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt;
  return g.status === "completed" ? modelLabel : `${modelLabel} (${g.status})`;
}

function mapGenerationsToTiles(items: GenerationRow[]): GenerationTile[] {
  return dedupeGenerationsByOutput(items).map((g) => {
    const modelLabel = composerModelDisplayLabel(
      g.composer_model_id,
      g.feature_type,
      g.provider
    );
    const title = historyTitle(g, modelLabel);

    if (isTtsGenerationRow(g)) {
      return {
        id: String(g.id),
        title,
        kind: "audio",
        audioSrc: g.output_url?.trim() || undefined,
        categoryLabel: "Text to Speech · Zorixa AI"
      };
    }

    if (g.feature_type === "video") {
      const out = g.output_url;
      const inn = g.input_url;
      const videoSrc = out?.trim() ? out : undefined;
      let src: string | undefined;
      if (out && !isLikelyVideoFile(out)) src = out;
      else if (inn && !isLikelyVideoFile(inn) && !inn.includes("placehold.co")) src = inn;

      return {
        id: String(g.id),
        title,
        kind: "video",
        src,
        videoSrc,
        categoryLabel: "Zorixa AI"
      };
    }

    const out = g.output_url;
    const inn = g.input_url;
    const src = out ?? (inn && !inn.includes("placehold.co") ? inn : undefined);
    return {
      id: String(g.id),
      title,
      kind: "image",
      src,
      categoryLabel: "Zorixa AI"
    };
  });
}

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/history");
  }

  const generationColumnsBase =
    "id, feature_type, output_url, input_url, status, created_at, provider";

  const primaryGenerations = await supabase
    .from("generations")
    .select(`${generationColumnsBase}, composer_model_id, prompt`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  let generations = primaryGenerations.data ?? [];

  if (primaryGenerations.error) {
    const fallbackGenerations = await supabase
      .from("generations")
      .select(generationColumnsBase)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    generations = (fallbackGenerations.data ?? []).map((row) => ({
      ...row,
      composer_model_id: null,
      prompt: null
    }));
  }

  const historyItems = mapGenerationsToTiles(generations as GenerationRow[]);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#080810] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,229,255,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(131,56,235,0.16),transparent_34%)]" />

      <section className="relative z-10 mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#00e5ff]">
              History
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Recent outputs
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Your latest AI images, videos, and speech assets.
            </p>
          </div>
        </div>

        {historyItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-14 text-center text-sm text-white/35">
            No generations yet. Start with Image Studio or Video Studio.
          </div>
        ) : (
          <GenerationGrid items={historyItems} />
        )}
      </section>
    </main>
  );
}
