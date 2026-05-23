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
} from "lucide-react";
import { DashboardNavbar } from "@/components/layout/Navbar";
import { StatsCard } from "./StatsCard";
import { GenerationGrid } from "./GenerationGrid";
import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import { QuickActions } from "./QuickActions";
import { UpgradeBanner } from "./upgrade-banner";
import { ViralToolsBento } from "./viral-tools-bento";
import { WelcomeBanner } from "./welcome-banner";

type GenerationRow = {
  id: number;
  feature_type: "image" | "video";
  input_url: string;
  output_url: string | null;
  status: string;
  created_at: string;
  provider?: string | null;
  composer_model_id?: string | null;
};

type GenerationTile = {
  id: string;
  title: string;
  kind: "image" | "video";
  src?: string;
  videoSrc?: string;
  /** Footer line under title in the grid card */
  categoryLabel?: string;
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

/** One tile per output URL — hides legacy duplicate DB rows in dashboard history. */
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

function mapGenerationsToTiles(items: GenerationRow[]): GenerationTile[] {
  return dedupeGenerationsByOutput(items).map((g) => {
    const modelLabel = composerModelDisplayLabel(
      g.composer_model_id,
      g.feature_type,
      g.provider
    );
    if (g.feature_type === "video") {
      const out = g.output_url;
      const inn = g.input_url;
      const videoSrc = out?.trim() ? out : undefined;

      let src: string | undefined;
      if (out && !isLikelyVideoFile(out)) src = out;
      else if (inn && !isLikelyVideoFile(inn) && !inn.includes("placehold.co")) src = inn;
      const title =
        g.status === "completed" ? modelLabel : `${modelLabel} (${g.status})`;
      return {
        id: String(g.id),
        title,
        kind: "video" as const,
        src,
        videoSrc,
        categoryLabel: "Zorixa AI"
      };
    }
    const out = g.output_url;
    const inn = g.input_url;
    const title =
      g.status === "completed" ? modelLabel : `${modelLabel} (${g.status})`;
    const src = out ?? (inn && !inn.includes("placehold.co") ? inn : undefined);
    return {
      id: String(g.id),
      title,
      kind: "image" as const,
      src,
      categoryLabel: "Zorixa AI"
    };
  });
}

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
  const uniqueGenerations = dedupeGenerationsByOutput(generations);
  const historyItems = mapGenerationsToTiles(generations);
  const total = uniqueGenerations.length;
  const imageRuns = uniqueGenerations.filter((g) => g.feature_type === "image").length;
  const videoRuns = uniqueGenerations.filter((g) => g.feature_type === "video").length;
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

        <ViralToolsBento />

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
              No generations yet. Start with image create or a UGC video.
            </div>
          ) : (
            <GenerationGrid items={historyItems} />
          )}
        </section>

      </main>
    </div>
  );
}
