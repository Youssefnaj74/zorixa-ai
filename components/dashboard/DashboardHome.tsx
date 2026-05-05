"use client";

import Link from "next/link";
import { Clapperboard, Image as ImageIcon, Sparkles, Wand2 } from "lucide-react";

import { GenerationGrid, type GenerationTile } from "@/components/dashboard/GenerationGrid";
import { Navbar } from "@/components/layout/Navbar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";

type GenerationRow = {
  id: number;
  feature_type: "image" | "video";
  input_url: string;
  output_url: string | null;
  status: string;
  created_at: string;
};

function isLikelyVideoFile(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return [".mp4", ".webm", ".mov", ".m4v"].some((ext) => path.endsWith(ext));
}

function mapGenerationsToTiles(items: GenerationRow[]): GenerationTile[] {
  return items.map((g) => {
    const dateLabel = new Date(g.created_at).toLocaleString();

    if (g.feature_type === "video") {
      const out = g.output_url;
      const inn = g.input_url;
      let src: string | undefined;
      if (out && !isLikelyVideoFile(out)) src = out;
      else if (inn && !isLikelyVideoFile(inn)) src = inn;
      return {
        id: String(g.id),
        title: g.status === "completed" ? `UGC video · ${dateLabel}` : `Video (${g.status}) · ${dateLabel}`,
        kind: "video" as const,
        src
      };
    }

    const pick = g.output_url ?? g.input_url;
    if (pick && isLikelyVideoFile(pick)) {
      return {
        id: String(g.id),
        title: `Output · ${dateLabel}`,
        kind: "video",
        src: undefined
      };
    }

    return {
      id: String(g.id),
      title: `Enhancement · ${dateLabel}`,
      kind: "image" as const,
      src: pick
    };
  });
}

export function DashboardHome({
  creditsDisplay,
  displayName,
  isPremium,
  upgradeHref,
  generations
}: {
  creditsDisplay: string;
  displayName: string | null;
  isPremium: boolean;
  upgradeHref: string;
  generations: GenerationRow[];
}) {
  const historyItems = mapGenerationsToTiles(generations);

  return (
    <div className="min-h-dvh bg-zorixa-bg font-sans text-white">
      <Navbar dashboardAuthBar />

      <main className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 pt-20 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-light">Zorixa AI</p>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Dashboard{displayName ? `, ${displayName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zorixa-muted">
              Image enhancement, UGC video generation, and your recent AI results in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/enhance"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold shadow-generate-pulse hover:opacity-95"
            >
              <Wand2 className="size-4" />
              Enhance image
            </Link>
            <Link
              href="/video"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              <Clapperboard className="size-4" />
              New UGC video
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold tabular-nums hover:bg-white/10"
            >
              Balance: {creditsDisplay}
            </Link>
          </div>
        </div>

        {!isPremium ? <UpgradeBanner checkoutHref={upgradeHref} /> : null}

        <div className="space-y-10">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Your results" value={String(generations.length)} hint="Saved in Supabase" />
            <StatsCard title="Credits available" value={creditsDisplay} hint="For AI generations" />
            <StatsCard
              title="Image runs"
              value={String(generations.filter((g) => g.feature_type === "image").length)}
              hint="Enhancement & stills"
            />
            <StatsCard
              title="Video runs"
              value={String(generations.filter((g) => g.feature_type === "video").length)}
              hint="UGC & motion"
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">Image enhancement</h2>
            <p className="text-sm text-zorixa-muted">
              Upscale, clean up, and prepare stills for campaigns and product pages.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard/enhance"
                className="zorixa-card-border group flex flex-col gap-3 rounded-2xl bg-zorixa-card p-5 shadow-glow transition-all hover:shadow-glow-lg"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-brand/15 text-brand-light ring-1 ring-brand/30">
                  <Sparkles className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-white">Studio enhance</h3>
                  <p className="mt-1 text-sm text-zorixa-muted">Before/after workspace with model presets.</p>
                </div>
              </Link>
              <Link
                href="/image"
                className="zorixa-card-border group flex flex-col gap-3 rounded-2xl bg-zorixa-card p-5 shadow-glow transition-all hover:shadow-glow-lg"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-brand/15 text-brand-light ring-1 ring-brand/30">
                  <ImageIcon className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-white">Image create</h3>
                  <p className="mt-1 text-sm text-zorixa-muted">Open the full image studio and library.</p>
                </div>
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">UGC video generation</h2>
            <p className="text-sm text-zorixa-muted">Short-form and UGC-style clips for social and ads.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/video"
                className="zorixa-card-border group flex flex-col gap-3 rounded-2xl bg-zorixa-card p-5 shadow-glow transition-all hover:shadow-glow-lg"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-brand/15 text-brand-light ring-1 ring-brand/30">
                  <Clapperboard className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-white">Video studio</h3>
                  <p className="mt-1 text-sm text-zorixa-muted">Models, motion, and export for UGC workflows.</p>
                </div>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-white">Quick actions</h2>
            <QuickActions className="mt-4" />
          </section>

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-white">History</h2>
              <Link href="/dashboard/history" className="text-sm font-medium text-brand-light hover:text-white">
                View all
              </Link>
            </div>
            <p className="mt-1 text-sm text-zorixa-muted">Recent AI outputs from your account (Supabase `generations`).</p>
            {historyItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center text-sm text-zorixa-muted">
                No generations yet. Start with image enhancement or a UGC video.
              </div>
            ) : (
              <GenerationGrid className="mt-4" items={historyItems} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
