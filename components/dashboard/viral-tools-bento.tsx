"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clapperboard,
  Sparkles,
  Volume2,
  Wand2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";
import { viralToolCardAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

type BentoTileProps = {
  href: string;
  title: string;
  headline?: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "cyan" | "violet" | "pink";
  src: string;
  className?: string;
  size?: "hero" | "tall" | "wide" | "default";
};

type CompactToolCard = {
  href: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "cyan" | "lime" | "pink";
  icon: LucideIcon;
};

function badgeClass(tone: BentoTileProps["badgeTone"] | CompactToolCard["badgeTone"]) {
  switch (tone) {
    case "lime":
      return "bg-[#c8ff2e] text-black";
    case "pink":
      return "bg-[#ff2f92] text-white";
    case "violet":
      return "bg-[#8338eb]/90 text-white";
    case "cyan":
    default:
      return "bg-[#00e5ff]/90 text-black";
  }
}

function BentoTile({
  href,
  title,
  headline,
  subtitle,
  badge,
  badgeTone = "cyan",
  src,
  className,
  size = "default"
}: BentoTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        size === "hero" && "col-span-12 lg:col-span-7 lg:row-span-2 min-h-[320px] lg:min-h-[420px]",
        size === "tall" && "col-span-12 sm:col-span-6 lg:col-span-5 lg:row-span-2 min-h-[280px]",
        size === "wide" && "col-span-12 sm:col-span-6 min-h-[200px]",
        size === "default" && "col-span-6 sm:col-span-3 min-h-[168px]",
        className
      )}
    >
      <Link
        href={href}
        className="group relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101018] transition-all duration-300 hover:border-[#00e5ff]/35 hover:shadow-[0_0_44px_rgba(0,229,255,0.1)]"
      >
        <Image
          src={src}
          alt={viralToolCardAlt(title, headline)}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes={
            size === "hero"
              ? "(max-width: 1024px) 100vw, 55vw"
              : size === "tall"
                ? "(max-width: 1024px) 100vw, 40vw"
                : "(max-width: 640px) 50vw, 25vw"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/55 to-[#080810]/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/[0.08] via-transparent to-[#8338eb]/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {badge ? (
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              badgeClass(badgeTone)
            )}
          >
            {badge}
          </span>
        ) : null}

        <div className="relative mt-auto flex flex-col gap-2 p-4 sm:p-5">
          {headline ? (
            <p className="font-heading text-3xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
              {headline}
            </p>
          ) : null}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-[#00e5ff] sm:text-base">
                {title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55 sm:text-sm">
                {subtitle}
              </p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition-colors group-hover:border-[#00e5ff]/50 group-hover:text-[#00e5ff]">
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CompactToolCard({
  href,
  title,
  subtitle,
  badge,
  badgeTone = "cyan",
  icon: Icon
}: CompactToolCard) {
  return (
    <Link
      href={href}
      className="group relative min-h-[132px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#18181d] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#00e5ff]/35 hover:bg-[#1f2027] hover:shadow-[0_18px_60px_rgba(0,229,255,0.08)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,229,255,0.08),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(131,56,235,0.1),transparent_38%)] opacity-70" />
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-9 place-items-center rounded-xl text-white/90 transition group-hover:text-[#00e5ff]">
            <Icon className="size-5" aria-hidden />
          </span>
          {badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[0_0_18px_rgba(0,229,255,0.2)]",
                badgeClass(badgeTone)
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <div>
          <h3 className="font-display text-base font-bold tracking-tight text-white">{title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/42">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function StudioLaunchpadBento() {
  const seedanceI2v = buildCatalogStudioHref("image-to-video", "seedance-2");
  const seedanceT2v = buildCatalogStudioHref("text-to-video", "seedance-2");
  const seedanceR2v = buildCatalogStudioHref("reference-to-video", "seedance-2");
  const gptImage = buildCatalogStudioHref("text-to-image", "gpt-image-2");
  const wanT2v = buildCatalogStudioHref("text-to-video", "wan-2-7");
  const wanI2v = buildCatalogStudioHref("image-to-video", "wan-2-7");
  const klingT2v = buildCatalogStudioHref("text-to-video", "kling-3-pro");
  const klingI2v = buildCatalogStudioHref("image-to-video", "kling-3-pro");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[#00e5ff]">
            Studio launchpad
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pick a lane<span className="text-[#00e5ff]">.</span>
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/45">
            Jump into the models that matter most. Every card opens the right studio, tab, and model.
          </p>
        </div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101018] px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-[#00e5ff]/40 hover:text-[#00e5ff]"
        >
          All tools
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <BentoTile
          href={seedanceI2v}
          size="hero"
          src="/dashboard-assets/dashboard-seedance-cinema.png"
          badge="VIDEO + IMAGE"
          badgeTone="cyan"
          headline="SEEDANCE"
          title="Seedance Cinema"
          subtitle="Turn still images into cinematic motion with Atlas Cloud."
        />

        <BentoTile
          href={gptImage}
          size="tall"
          src="/dashboard-assets/dashboard-freelance-ai.png"
          badge="NEW"
          badgeTone="pink"
          headline="FREELANCE"
          title="Freelance AI"
          subtitle="Fast visuals for client work, brand boards, and creator assets."
        />

        <BentoTile
          href={wanT2v}
          size="wide"
          src="/dashboard-assets/dashboard-cinema-studio.png"
          badge="VIDEO"
          badgeTone="cyan"
          title="Cinema AI"
          subtitle="Storyboard scenes, film frames, and dramatic video concepts."
        />

        <BentoTile
          href={klingI2v}
          size="default"
          src="/dashboard-assets/dashboard-ugc-video.png"
          badge="PRO"
          badgeTone="pink"
          title="UGC Video"
          subtitle="Creator ads, product demos, and social-first clips."
        />

        <BentoTile
          href={seedanceT2v}
          size="default"
          src="/tool-previews/text-to-video-seedance-2.png"
          badge="T2V"
          title="Seedance T2V"
          subtitle="Fast text-to-video iterations."
        />

        <BentoTile
          href={seedanceR2v}
          size="default"
          src="/tool-previews/reference-to-video-seedance-2.png"
          badge="R2V"
          title="Seedance refs"
          subtitle="Up to 9 images · 3 videos · 3 audios."
        />

        <BentoTile
          href={wanI2v}
          size="default"
          src="/tool-previews/image-to-video-wan-2-7.png"
          title="Wan I2V"
          subtitle="Animate stills with end-frame support."
        />

        <BentoTile
          href={klingT2v}
          size="default"
          src="/tool-previews/text-to-video-kling-3-pro.png"
          title="Kling T2V"
          subtitle="Cinematic text prompts · aspect 16:9 / 9:16 / 1:1."
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <BentoTile
          href="/image"
          size="wide"
          src="/dashboard-assets/dashboard-freelance-ai.png"
          badge="IMAGE"
          title="Freelance studio"
          subtitle="GPT Image 2 · Nano Banana · Qwen 2.0 Pro."
        />
        <BentoTile
          href="/video"
          size="wide"
          src="/dashboard-assets/dashboard-cinema-studio.png"
          badge="VIDEO"
          badgeTone="violet"
          title="Cinema studio"
          subtitle="Veo · Wan · Kling · Seedance workflows."
        />
      </div>
    </section>
  );
}

function QuickLaunchTools() {
  const seedanceCinema = buildCatalogStudioHref("image-to-video", "seedance-2", {
    toolName: "Seedance 2.0 Image to Video"
  });
  const textToVideo = buildCatalogStudioHref("text-to-video", "seedance-2", {
    toolName: "Seedance 2.0 Text to Video"
  });
  const referenceToVideo = buildCatalogStudioHref("reference-to-video", "seedance-2", {
    toolName: "Seedance 2.0 Reference to Video"
  });
  const gptImage2 = buildCatalogStudioHref("text-to-image", "gpt-image-2", {
    toolName: "GPT Image 2"
  });
  const audioToVideo = buildCatalogStudioHref("audio-to-video", "infinitetalk", {
    toolName: "InfiniteTalk Audio to Video"
  });

  const toolCards: CompactToolCard[] = [
    {
      href: textToVideo,
      title: "Text to Video",
      subtitle: "Create high-quality videos from text prompts",
      icon: Clapperboard,
      badge: "TRENDING",
      badgeTone: "cyan"
    },
    {
      href: referenceToVideo,
      title: "Reference to Video",
      subtitle: "Guide videos with images, clips, and audio",
      icon: Wand2,
      badge: "NEW",
      badgeTone: "cyan"
    },
    {
      href: gptImage2,
      title: "GPT Image 2",
      subtitle: "Cinematic portraits and visuals from text prompts",
      icon: Sparkles,
      badge: "NEW",
      badgeTone: "cyan"
    },
    {
      href: audioToVideo,
      title: "Audio to Video",
      subtitle: "Turn portraits and audio into talking videos",
      icon: Volume2
    }
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[#00e5ff]">
          Quick launch
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Popular workflows
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.68fr_1fr]">
        <Link
          href={seedanceCinema}
          className="group relative min-h-[280px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#101018] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition duration-300 hover:border-[#00e5ff]/35"
        >
          <Image
            src="/dashboard-assets/dashboard-seedance-cinema.png"
            alt={viralToolCardAlt("Seedance Cinema", "Seedance 2.0 Cinematic AI")}
            fill
            className="object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-75"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0d1114_0%,rgba(13,17,20,0.82)_32%,rgba(13,17,20,0.2)_100%)]" />
          <div className="relative flex h-full min-h-[232px] flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                  Seedance 2.0 Cinema
                </h3>
                <span className="rounded-full bg-[#00e5ff] px-2 py-0.5 text-[9px] font-black uppercase italic text-black">
                  New
                </span>
              </div>
              <p className="mt-2 max-w-[250px] text-sm leading-relaxed text-white/55">
                Turn stills into cinematic motion with Seedance 2.0.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition group-hover:bg-[#00e5ff]">
              Try now
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          {toolCards.map((card) => (
            <CompactToolCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ViralToolsBento() {
  return (
    <div className="space-y-10">
      <StudioLaunchpadBento />
      <QuickLaunchTools />
    </div>
  );
}
