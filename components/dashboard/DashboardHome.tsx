"use client";

import Link from "next/link";
import { Activity, Cpu, Sparkles, Zap } from "lucide-react";

import { GenerationGrid, type GenerationTile } from "@/components/dashboard/GenerationGrid";
import { Navbar } from "@/components/layout/Navbar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCard } from "@/components/dashboard/StatsCard";

const MOCK_GRID: GenerationTile[] = [
  {
    id: "g1",
    src: "https://picsum.photos/seed/a1/800/600",
    title: "Campaign still — lavender chrome"
  },
  {
    id: "g2",
    src: "https://picsum.photos/seed/a2/800/900",
    title: "Portrait loop — soft bloom"
  },
  {
    id: "g3",
    src: "https://picsum.photos/seed/a3/800/500",
    title: "Product macro — crisp edges"
  },
  {
    id: "g4",
    src: "https://picsum.photos/seed/a4/800/700",
    title: "Social clip — kinetic type"
  },
  {
    id: "g5",
    src: "https://picsum.photos/seed/a5/800/550",
    title: "Lookbook — runway lighting"
  },
  {
    id: "g6",
    src: "https://picsum.photos/seed/a6/800/650",
    title: "UGC clean-up — noise aware"
  }
];

export function DashboardHome({
  creditsDisplay,
  displayName
}: {
  creditsDisplay: string;
  displayName: string | null;
}) {
  return (
    <div className="min-h-dvh bg-zorixa-bg font-sans text-white">
      <Navbar />
      <main className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-light">Zorixa AI</p>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Dashboard{displayName ? `, ${displayName.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zorixa-muted">
              Generate stunning images and videos, monitor credits, and jump back into recent work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/image"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold shadow-generate-pulse hover:opacity-95"
            >
              <Sparkles className="size-4" />
              New generation
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              Credits: {creditsDisplay}
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total generations" value="1,248" hint="Last 30 days" />
          <StatsCard title="Credits used" value={creditsDisplay} hint="Including bonus grants" />
          <StatsCard title="Active models" value="12" hint="Image + video stacks" />
          <StatsCard title="Recent activity" value="Live" hint="Queues healthy" />
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-white">Quick actions</h2>
          <QuickActions className="mt-4" />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-white">Recent generations</h2>
              <Link href="/dashboard/history" className="text-sm font-medium text-brand-light hover:text-white">
                View gallery
              </Link>
            </div>
            <GenerationGrid className="mt-4" items={MOCK_GRID} />
          </div>

          <aside className="zorixa-card-border h-fit rounded-2xl bg-zorixa-card p-5 shadow-glow">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
              <Activity className="size-4 text-brand-light" />
              Activity feed
            </h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="mt-1 grid size-8 place-items-center rounded-lg bg-brand/15 text-brand-light">
                  <Zap className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-white">Batch export completed</p>
                  <p className="text-xs text-zorixa-muted">Skin retouch pack • 2m ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 grid size-8 place-items-center rounded-lg bg-brand/15 text-brand-light">
                  <Cpu className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-white">Model warm cache hit</p>
                  <p className="text-xs text-zorixa-muted">Nano Banana 2 • 14m ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 grid size-8 place-items-center rounded-lg bg-brand/15 text-brand-light">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-white">New preset synced</p>
                  <p className="text-xs text-zorixa-muted">University track • 1h ago</p>
                </div>
              </li>
            </ul>
          </aside>
        </section>
      </main>
    </div>
  );
}
