"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  DASHBOARD_SEEDANCE_SHOWCASE,
  SEEDANCE_SHOWCASE_STUDIO_HREF,
  type DashboardSeedanceClip
} from "@/lib/dashboard-seedance-showcase";

function ShowcaseClip({ clip }: { clip: DashboardSeedanceClip }) {
  const href = clip.href ?? SEEDANCE_SHOWCASE_STUDIO_HREF;

  return (
    <Link
      href={href}
      className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.08] bg-[#101018] transition duration-300 hover:border-[#00e5ff]/35 hover:shadow-[0_12px_40px_rgba(0,229,255,0.1)]"
      title={clip.prompt}
    >
      <video
        src={clip.src}
        className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        muted
        playsInline
        loop
        autoPlay
        preload="metadata"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full border border-white/15 bg-black/50 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-hover:text-[#00e5ff]">
        <ArrowUpRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}

/** Auto-playing Seedance 2.0 clip grid for the dashboard (3:4, 5s showcase). */
export function DashboardSeedanceShowcase() {
  const { clips } = DASHBOARD_SEEDANCE_SHOWCASE;
  if (!clips.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Seedance 2.0
          </h2>
        </div>
        <Link
          href={SEEDANCE_SHOWCASE_STUDIO_HREF}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101018] px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-[#00e5ff]/40 hover:text-[#00e5ff]"
        >
          Create yours
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {clips.map((clip) => (
          <ShowcaseClip key={clip.id} clip={clip} />
        ))}
      </div>
    </section>
  );
}
