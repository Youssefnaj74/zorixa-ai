import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: generations } = await supabase
    .from("generations")
    .select("id, feature_type, status, credits_spent, input_url, output_url, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, type, credits_amount, feature_used, stripe_payment_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>

      <p className="mt-2 text-sm text-zinc-300">
        Recent generations and credit activity{user?.email ? ` for ${user.email}` : ""}.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold text-white">Generations</h2>
          <div className="mt-4 space-y-3">
            {(generations ?? []).length === 0 ? (
              <div className="text-sm text-zinc-400">No generations yet.</div>
            ) : (
              generations?.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border border-white/10 bg-zinc-950/30 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">
                      {g.feature_type === "image" ? "Image enhancement" : "Video generation"}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {new Date(g.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Status: <span className="text-zinc-200">{g.status}</span> · Credits:{" "}
                    <span className="text-zinc-200">{g.credits_spent}</span>
                  </div>
                  {g.output_url ? (
                    <a
                      className="mt-2 inline-flex text-xs text-zinc-200 underline underline-offset-4 hover:text-white"
                      href={g.output_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open output
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold text-white">Transactions</h2>
          <div className="mt-4 space-y-3">
            {(transactions ?? []).length === 0 ? (
              <div className="text-sm text-zinc-400">No transactions yet.</div>
            ) : (
              transactions?.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-white/10 bg-zinc-950/30 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">
                      {t.type === "purchase" ? "Credit purchase" : "Usage"}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Credits:{" "}
                    <span className={t.credits_amount >= 0 ? "text-emerald-300" : "text-red-300"}>
                      {t.credits_amount}
                    </span>
                    {t.feature_used ? (
                      <>
                        {" "}
                        · Feature: <span className="text-zinc-200">{t.feature_used}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
