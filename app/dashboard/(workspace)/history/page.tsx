import { redirect } from "next/navigation";

import { HistoryFilteredGrid } from "@/components/dashboard/HistoryFilteredGrid";
import {
  mapGenerationsToTiles,
  type GenerationHistoryRow
} from "@/lib/map-generations-to-tiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asGenerationRows(data: unknown): GenerationHistoryRow[] {
  if (!Array.isArray(data)) return [];
  return data as GenerationHistoryRow[];
}

function asCreditRows(data: unknown): Pick<GenerationHistoryRow, "id" | "credits_spent">[] {
  if (!Array.isArray(data)) return [];
  return data as Pick<GenerationHistoryRow, "id" | "credits_spent">[];
}

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/history");
  }

  const listGenerations = (columns: string) =>
    supabase
      .from("generations")
      .select(columns)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

  async function mergeCreditsSpent(
    rows: GenerationHistoryRow[]
  ): Promise<GenerationHistoryRow[]> {
    const { data, error } = await listGenerations("id, credits_spent");
    if (error) return rows;
    const credits = asCreditRows(data);
    if (!credits.length) return rows;
    const byId = new Map(
      credits.map((r) => [r.id, Math.max(0, Math.round(r.credits_spent ?? 0))])
    );
    return rows.map((row) => ({
      ...row,
      credits_spent: byId.get(row.id) ?? row.credits_spent ?? 0
    }));
  }

  let generations: GenerationHistoryRow[] = [];

  const primaryGenerations = await listGenerations(
    "id, feature_type, output_url, input_url, status, created_at, provider, composer_model_id, prompt, credits_spent"
  );

  if (!primaryGenerations.error && primaryGenerations.data) {
    generations = asGenerationRows(primaryGenerations.data);
  } else {
    const withCredits = await listGenerations(
      "id, feature_type, output_url, input_url, status, created_at, provider, credits_spent"
    );
    if (!withCredits.error && withCredits.data) {
      generations = asGenerationRows(withCredits.data).map((row) => ({
        ...row,
        composer_model_id: null,
        prompt: null
      }));
    } else {
      const fallbackGenerations = await listGenerations(
        "id, feature_type, output_url, input_url, status, created_at, provider"
      );
      generations = await mergeCreditsSpent(
        asGenerationRows(fallbackGenerations.data).map((row) => ({
          ...row,
          composer_model_id: null,
          prompt: null,
          credits_spent: 0
        }))
      );
    }
  }

  if (
    generations.length > 0 &&
    generations.every((g) => !g.credits_spent || g.credits_spent === 0)
  ) {
    generations = await mergeCreditsSpent(generations);
  }

  const historyItems = mapGenerationsToTiles(generations);

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
              Your latest AI images, videos, and speech assets. Credits charged per run.
              Video links from Atlas may expire after about 1–7 days — download new outputs to keep them.
            </p>
          </div>
        </div>

        {historyItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] px-6 py-14 text-center text-sm text-white/35">
            No generations yet. Start with Image Studio or Video Studio.
          </div>
        ) : (
          <HistoryFilteredGrid items={historyItems} />
        )}
      </section>
    </main>
  );
}
