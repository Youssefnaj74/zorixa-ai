"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";
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

function badgeClass(tone: BentoTileProps["badgeTone"]) {
  switch (tone) {
    case "pink":
      return "bg-[#ff4fd8]/90 text-white";
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
          alt=""
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

/** Higgsfield-style bento — Seedance, GPT Image 2, latest video models. */
export function ViralToolsBento() {
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
          subtitle="GPT Image 2 · Nano Banana · Zorixa Image."
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
        <BentoTile
          href="/tools"
          size="wide"
          src="/dashboard-assets/dashboard-ugc-video.png"
          badge="UGC"
          title="UGC video"
          subtitle="Creator workflows, ads, and product content."
        />
      </div>
    </section>
  );
}
