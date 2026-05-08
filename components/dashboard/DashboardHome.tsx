"use client";

import { useCallback } from "react";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Wand2,
  Clapperboard,
  BarChart3,
  Coins,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { DashboardNavbar } from "@/components/layout/Navbar";
import { StatsCard } from "./StatsCard";
import { GenerationGrid } from "./GenerationGrid";
import { QuickActions } from "./QuickActions";
import { UpgradeBanner } from "./upgrade-banner";
import { WelcomeBanner } from "./welcome-banner";

type GenerationRow = {
  id: number;
  feature_type: "image" | "video";
  input_url: string;
  output_url: string | null;
  status: string;
  created_at: string;
};

type GenerationTile = {
  id: string;
  title: string;
  kind: "image" | "video";
  src?: string;
};

function formatCreditsStat(n: number): string {
  const v = Math.round(n);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

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
        src,
      };
    }
    const pick = g.output_url ?? g.input_url;
    if (pick && isLikelyVideoFile(pick)) {
      return { id: String(g.id), title: `Output · ${dateLabel}`, kind: "video", src: undefined };
    }
    return { id: String(g.id), title: `Enhancement · ${dateLabel}`, kind: "image" as const, src: pick };
  });
}

const toolCard =
  "relative overflow-hidden rounded-2xl border border-[#1e1e30] bg-[#0f0f1e] p-5 transition-all duration-300 hover:border-[#00e5ff]/40 hover:bg-[#111122] group block";

export function DashboardHome({
  credits,
  creditsDisplay,
  displayName,
  userEmail,
  isPremium,
  upgradeHref,
  welcomeTagline,
  generations,
}: {
  credits: number;
  creditsDisplay: string;
  displayName: string | null;
  userEmail: string | null;
  isPremium: boolean;
  upgradeHref: string;
  welcomeTagline: string;
  generations: GenerationRow[];
}) {
  const scheduleNavigation = useScheduledAppRouterNavigation();
  const historyItems = mapGenerationsToTiles(generations);
  const total = generations.length;
  const imageRuns = generations.filter((g) => g.feature_type === "image").length;
  const videoRuns = generations.filter((g) => g.feature_type === "video").length;
  const splitTotal = imageRuns + videoRuns;

  const onSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    scheduleNavigation("/");
  }, [scheduleNavigation]);

  return (
    <div className="relative min-h-dvh bg-[#080810] font-body text-white">
      <DashboardNavbar
        credits={credits}
        userEmail={userEmail}
        displayName={displayName}
        avatarUrl={null}
        onSignOut={onSignOut}
      />

      <main className="relative z-10 mx-auto max-w-[1400px] space-y-10 px-4 py-8 pt-24 lg:px-8">

        {/* Header */}
        <motion.div
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              Dashboard<span className="text-[#00e5ff]">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
              Welcome to your personal creative command center. Image enhancement, UGC video, and recent outputs — all in one place.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard/enhance"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00e5ff] px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
              >
                <Wand2 className="size-4" />
                Enhance image
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/video"
                className="inline-flex items-center gap-2 rounded-xl border border-[#1e1e30] bg-[#0f0f1e] px-5 py-2.5 text-sm font-semibold text-white hover:border-[#00e5ff]/40 transition-colors"
              >
                <Clapperboard className="size-4" />
                New UGC video
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/pricing"
                className="rounded-xl border border-[#1e1e30] bg-[#0f0f1e] px-5 py-2.5 text-sm font-semibold tabular-nums text-white/80 hover:border-[#00e5ff]/40 transition-colors"
              >
                Balance: {creditsDisplay}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <WelcomeBanner displayName={displayName} tagline={welcomeTagline} />
        {!isPremium && <UpgradeBanner checkoutHref={upgradeHref} />}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Your results" value={total} hint="Saved in Supabase" icon={BarChart3} progress={Math.min(100, total * 4)} />
          <StatsCard title="Credits available" value={credits} format={formatCreditsStat} hint="For AI generations" icon={Coins} progress={Math.min(100, (credits / 800) * 100)} />
          <StatsCard title="Image runs" value={imageRuns} hint="Enhancement & stills" icon={ImageIcon} progress={splitTotal ? Math.round((imageRuns / splitTotal) * 100) : 0} />
          <StatsCard title="Video runs" value={videoRuns} hint="UGC & motion" icon={Clapperboard} progress={splitTotal ? Math.round((videoRuns / splitTotal) * 100) : 0} />
        </section>

        {/* Image Enhancement */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Image enhancement</h2>
          <p className="text-sm text-white/40">Upscale, clean up, and prepare stills for campaigns and product pages.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
              <Link href="/dashboard/enhance" className={toolCard}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                  <span className="grid size-12 place-items-center rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/10 text-[#00e5ff]">
                    <Sparkles className="size-6" />
                  </span>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white">Studio enhance</h3>
                    <p className="mt-1 text-sm text-white/40">Before/after workspace with model presets.</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Link href="/image" className={toolCard}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                  <span className="grid size-12 place-items-center rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/10 text-[#00e5ff]">
                    <ImageIcon className="size-6" />
                  </span>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white">Image create</h3>
                    <p className="mt-1 text-sm text-white/40">Open the full image studio and library.</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* UGC Video */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">UGC video generation</h2>
          <p className="text-sm text-white/40">Short-form and UGC-style clips for social and ads.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link href="/video" className={toolCard}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                  <span className="grid size-12 place-items-center rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/10 text-[#00e5ff]">
                    <Clapperboard className="size-6" />
                  </span>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white">Video studio</h3>
                    <p className="mt-1 text-sm text-white/40">Models, motion, and export for UGC workflows.</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Quick actions</h2>
          <p className="text-sm text-white/40">Jump back into your most-used flows.</p>
          <QuickActions />
        </section>

        {/* History */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h2 className="text-lg font-bold text-white">History</h2>
            <Link href="/dashboard/history" className="text-sm font-medium text-[#00e5ff] hover:opacity-70 transition-opacity">
              View all
            </Link>
          </div>
          <p className="text-sm text-white/40 mb-4">Recent AI outputs from your account.</p>
          {historyItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1e1e30] bg-[#0f0f1e] px-6 py-12 text-center text-sm text-white/30">
              No generations yet. Start with image enhancement or a UGC video.
            </div>
          ) : (
            <GenerationGrid items={historyItems} />
          )}
        </section>

      </main>
    </div>
  );
}
