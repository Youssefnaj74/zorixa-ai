import { redirect } from "next/navigation";

import { HistoryFilteredGrid } from "@/components/dashboard/HistoryFilteredGrid";
import {
  mapGenerationsToTiles,
  type GenerationHistoryRow
} from "@/lib/map-generations-to-tiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    .select(`${generationColumnsBase}, composer_model_id, prompt, credits_spent`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  let generations: GenerationHistoryRow[] = (primaryGenerations.data ??
    []) as GenerationHistoryRow[];

  if (primaryGenerations.error) {
    const fallbackGenerations = await supabase
      .from("generations")
      .select(generationColumnsBase)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    generations = (fallbackGenerations.data ?? []).map((row) => ({
      ...(row as GenerationHistoryRow),
      composer_model_id: null,
      prompt: null,
      credits_spent: 0
    }));
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
