"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import {
  EXPLORE_PROMPT_MODEL_FILTERS,
  buildExplorePromptStudioHref,
  explorePromptsForModel,
  type ExplorePromptEntry
} from "@/lib/explore-prompts-catalog";
import { cn } from "@/lib/utils";

function ExplorePromptCard({ entry }: { entry: ExplorePromptEntry }) {
  const href = buildExplorePromptStudioHref(entry);

  const copyPrompt = () => {
    void navigator.clipboard.writeText(entry.prompt);
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5 hover:border-[rgba(131,56,235,0.35)]">
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40 sm:aspect-[4/5]">
          <ExternalImage
            src={entry.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-display text-sm font-bold text-white">{entry.title}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00e5ff]">
              Zorixa Image
            </p>
          </div>
        </div>
      </Link>
      <div className="border-t border-white/[0.06] p-3">
        <p className="line-clamp-2 text-xs leading-relaxed text-white/55">{entry.prompt}</p>
        <div className="mt-3 flex gap-2">
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white shadow-[0_0_16px_rgba(131,56,235,0.35)] hover:bg-brand/90"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Use prompt
          </Link>
          <button
            type="button"
            onClick={copyPrompt}
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white/70 hover:text-white"
            title="Copy prompt"
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ExplorePromptsView() {
  const searchParams = useSearchParams();
  const [modelFilter, setModelFilter] = useState<string>("zorixa");

  useEffect(() => {
    const raw = searchParams.get("model")?.trim();
    if (!raw) return;
    const exists = EXPLORE_PROMPT_MODEL_FILTERS.some((f) => f.id === raw);
    if (exists) setModelFilter(raw);
  }, [searchParams]);

  const items = useMemo(() => explorePromptsForModel(modelFilter), [modelFilter]);
  const filterLabel =
    EXPLORE_PROMPT_MODEL_FILTERS.find((f) => f.id === modelFilter)?.label ?? "All";

  return (
    <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 pb-16 pt-6 lg:px-8">
      <aside className="hidden w-52 shrink-0 lg:block">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Models</p>
        <ul className="space-y-1">
          {EXPLORE_PROMPT_MODEL_FILTERS.map((f) => {
            const active = modelFilter === f.id;
            const count = explorePromptsForModel(f.id).length;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setModelFilter(f.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#00e5ff]/15 text-[#00e5ff]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <span>{f.label}</span>
                  {count > 0 ? (
                    <span className="text-[10px] tabular-nums text-white/35">{count}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Explore prompts
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zorixa-muted">
              Curated English prompts for Zorixa Image and Atlas models. Tap a card to open the
              studio with the prompt pre-filled.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/80 hover:text-white"
          >
            My generations
          </Link>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {EXPLORE_PROMPT_MODEL_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setModelFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
                modelFilter === f.id
                  ? "border-[#00e5ff]/40 bg-[#00e5ff]/10 text-[#00e5ff]"
                  : "border-white/10 text-white/50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-sm text-white/50">
              No curated prompts for <span className="text-white">{filterLabel}</span> yet.
            </p>
            <button
              type="button"
              onClick={() => setModelFilter("zorixa")}
              className="mt-4 text-sm font-semibold text-brand-light hover:underline"
            >
              Browse Zorixa Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {items.map((entry) => (
              <ExplorePromptCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
