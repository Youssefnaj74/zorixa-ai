"use client";

import { useCallback } from "react";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";
import { formatInteger } from "@/lib/format-number";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Clapperboard,
  Coins,
  Image as ImageIcon,
  Layers3,
  Play,
  Sparkles,
  Wand2
} from "lucide-react";
import { DashboardNavbar } from "@/components/layout/Navbar";
import { StatsCard } from "./StatsCard";
import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";
import { isTtsGenerationRow } from "@/lib/tts-generation-shared";
import { UpgradeBanner } from "./upgrade-banner";
import { OnboardingCard } from "./OnboardingCard";
import { DashboardSeedanceShowcase } from "./dashboard-seedance-showcase";
import { ViralToolsBento } from "./viral-tools-bento";

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

function formatCreditsStat(n: number): string {
  return formatInteger(n);
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

const FEATURED_MODELS = [
  {
    title: "Cinema AI",
    subtitle: "Build cinematic shots, film frames, and dramatic campaign visuals.",
    href: "/video",
    src: "/dashboard-assets/dashboard-cinema-studio.png",
    badge: "CINEMA"
  },
  {
    title: "Freelance AI",
    subtitle: "Creator-ready assets for client work, brands, and social campaigns.",
    href: "/image",
    src: "/dashboard-assets/dashboard-freelance-ai.png",
    badge: "CREATOR"
  },
  {
    title: "UGC Video",
    subtitle: "Creator ads, product demos, and social-first vertical clips.",
    href: "/video",
    src: "/dashboard-assets/dashboard-ugc-video.png",
    badge: "UGC"
  },
  {
    title: "Seedance Cinema",
    subtitle: "Move stills into cinematic short clips with motion trails.",
    href: "/video?tab=Image+to+Video&model=seedance-2&from=tools&name=Seedance+2.0+Image+to+Video",
    src: "/dashboard-assets/dashboard-seedance-cinema.png",
    badge: "SEEDANCE"
  }
] as const;

const NEW_MODEL_CARDS: {
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}[] = [
  {
    title: "GPT Image 2",
    subtitle: "Next-gen image generation",
    href: buildCatalogStudioHref("text-to-image", "gpt-image-2", {
      toolName: "GPT Image 2 Text to Image"
    }),
    icon: ImageIcon,
    badge: "NEW"
  },
  {
    title: "HappyHorse",
    subtitle: "Text & Image to Video",
    href: buildCatalogStudioHref("image-to-video", "happyhorse-1", {
      toolName: "HappyHorse 1.0 Image to Video"
    }),
    icon: Clapperboard
  },
  {
    title: "GPT Image 2",
    subtitle: "Next-gen image editing",
    href: buildCatalogStudioHref("image-to-image", "gpt-image-2", {
      toolName: "GPT Image 2 Image to Image"
    }),
    icon: ImageIcon,
    badge: "EDIT"
  },
  {
    title: "Seedance 2.0",
    subtitle: "Text & Image to Video",
    href: buildCatalogStudioHref("text-to-video", "seedance-2", {
      toolName: "Seedance 2.0 Text to Video"
    }),
    icon: Clapperboard,
    badge: "NEW"
  },
  {
    title: "Nano Banana Pro",
    subtitle: "Premium image model",
    href: buildCatalogStudioHref("text-to-image", "nano-banana-pro", {
      toolName: "Nano Banana Pro Text to Image"
    }),
    icon: Wand2
  },
  {
    title: "Creative Studio",
    subtitle: "All image & video tools",
    href: "/tools",
    icon: Layers3,
    badge: "HOT"
  }
];

function StudioCard({
  href,
  title,
  subtitle,
  src,
  icon: Icon,
  badge,
  className
}: {
  href: string;
  title: string;
  subtitle: string;
  src: string;
  icon: LucideIcon;
  badge: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[240px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${className ?? ""}`}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/10 via-transparent to-[#8338eb]/20 opacity-80" />
      <div className="relative mt-auto flex w-full items-end justify-between gap-5 p-5 sm:p-6">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00e5ff] backdrop-blur">
            <Icon className="size-3.5" aria-hidden />
            {badge}
          </span>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">{subtitle}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition group-hover:border-[#00e5ff]/50 group-hover:text-[#00e5ff]">
          <ArrowRight className="size-5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function NewModelsStrip() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/20 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-white/45" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">
            New models
          </p>
        </div>
        <Link
          href="/tools"
          className="text-xs font-semibold text-[#00e5ff] transition hover:text-white"
        >
          View more
        </Link>
      </div>

      <div className="relative overflow-hidden pb-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-[#090914] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[#090914] to-transparent" />
        <motion.div
          className="flex w-max gap-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1].map((loop) =>
            NEW_MODEL_CARDS.map(({ title, subtitle, href, icon: Icon, badge }) => (
              <Link
                key={`${loop}-${title}-${subtitle}`}
                href={href}
                aria-hidden={loop === 1}
                tabIndex={loop === 1 ? -1 : undefined}
                className="group relative flex min-w-[220px] items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#00e5ff]/35 hover:bg-white/[0.07]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/30 text-white/70 transition group-hover:border-[#00e5ff]/40 group-hover:text-[#00e5ff]">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{title}</span>
                    {badge ? (
                      <span className="rounded-full bg-[#001b26] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#00e5ff]">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-white/42">{subtitle}</span>
                </span>
                <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/45 to-transparent opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedModelStrip() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00e5ff]">
            Featured models
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Start from what performs.
          </h2>
        </div>
        <Link
          href="/tools"
          className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-[#00e5ff]/40 hover:text-white sm:inline-flex"
        >
          Browse all tools
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED_MODELS.map((model) => (
          <Link
            key={model.title}
            href={model.href}
            className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101018] transition hover:border-[#00e5ff]/35 hover:shadow-[0_18px_60px_rgba(0,229,255,0.08)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={model.src}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white/85 backdrop-blur">
                {model.badge}
              </span>
            </div>
            <div className="p-4">
              <p className="font-display text-sm font-bold text-white">{model.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">
                {model.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
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
  const total = uniqueGenerations.length;
  const imageRuns = uniqueGenerations.filter((g) => g.feature_type === "image").length;
  const speechRuns = uniqueGenerations.filter((g) => isTtsGenerationRow(g)).length;
  const videoRuns = uniqueGenerations.filter(
    (g) => g.feature_type === "video" && !isTtsGenerationRow(g)
  ).length;
  const splitTotal = imageRuns + videoRuns + speechRuns;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? "there";
  const showOnboarding = credits <= 0 && total === 0;

  const onSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    scheduleNavigation("/");
  }, [scheduleNavigation]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#080810] font-body text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,229,255,0.13),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(131,56,235,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
      <DashboardNavbar
        credits={credits}
        userEmail={userEmail}
        displayName={displayName}
        avatarUrl={null}
        onSignOut={onSignOut}
      />

      <main className="relative z-10 mx-auto max-w-[1500px] space-y-8 px-4 py-8 pt-24 lg:px-8">
        {showOnboarding ? <OnboardingCard checkoutHref={upgradeHref} /> : null}

        <motion.div
          className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7 lg:min-h-[460px]">
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[#8338eb]/25 blur-3xl" />
            <div className="absolute -bottom-28 left-1/4 size-72 rounded-full bg-[#00e5ff]/15 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/70">
                  <Sparkles className="size-3.5 text-[#00e5ff]" aria-hidden />
                  Welcome back, {firstName}
                </span>
                <Link
                  href="/pricing"
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold tabular-nums text-white/75 transition hover:border-[#00e5ff]/40 hover:text-white"
                >
                  {creditsDisplay} credits
                </Link>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#00e5ff]">
                  Zorixa creative studio
                </p>
                <h1 className="mt-3 max-w-3xl font-display text-5xl font-black uppercase leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Create with Zorixa
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
                  {welcomeTagline} Launch images, motion, speech, and campaign assets from one premium studio dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/image"
                  className="inline-flex items-center gap-2 rounded-full bg-[#00e5ff] px-5 py-3 text-sm font-bold text-black shadow-[0_0_32px_rgba(0,229,255,0.25)] transition hover:scale-[1.02]"
                >
                  <Wand2 className="size-4" aria-hidden />
                  Image studio
                </Link>
                <Link
                  href="/video"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00e5ff]/40"
                >
                  <Play className="size-4" aria-hidden />
                  Video studio
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-[#00e5ff]/40 hover:text-white"
                >
                  <Layers3 className="size-4" aria-hidden />
                  Tools
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <StudioCard
              href="/image"
              title="Freelance AI"
              subtitle="Turn briefs into polished client visuals, campaign frames, and brand assets."
              src="/dashboard-assets/dashboard-freelance-ai.png"
              icon={ImageIcon}
              badge="IMAGE + CLIENT WORK"
            />
            <StudioCard
              href="/video"
              title="Cinema Studio"
              subtitle="Storyboard scenes, film frames, and Veo · Wan · Kling · Seedance workflows."
              src="/dashboard-assets/dashboard-cinema-studio.png"
              icon={Clapperboard}
              badge="VIDEO + CINEMA"
            />
          </div>
        </motion.div>

        {!isPremium && credits <= 0 && <UpgradeBanner checkoutHref={upgradeHref} />}

        <NewModelsStrip />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Results" value={total} hint="Saved outputs" icon={BarChart3} progress={Math.min(100, total * 4)} />
          <StatsCard title="Credits" value={credits} format={formatCreditsStat} hint="Available balance" icon={Coins} progress={Math.min(100, (credits / 800) * 100)} />
          <StatsCard title="Images" value={imageRuns} hint="Generated stills" icon={ImageIcon} progress={splitTotal ? Math.round((imageRuns / splitTotal) * 100) : 0} />
          <StatsCard title="Videos" value={videoRuns} hint="Motion runs" icon={Clapperboard} progress={splitTotal ? Math.round((videoRuns / splitTotal) * 100) : 0} />
        </section>

        <FeaturedModelStrip />

        <DashboardSeedanceShowcase />

        <ViralToolsBento />

      </main>
    </div>
  );
}
