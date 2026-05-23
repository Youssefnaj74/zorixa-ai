"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clapperboard, ImageIcon, Sparkles } from "lucide-react";

import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";
import { cn } from "@/lib/utils";

type BentoTileProps = {
  href: string;
  title: string;
  headline?: string;
  subtitle: string;
  badge?: string;
  badgeTone?: "lime" | "pink" | "cyan";
  visual: "seedance" | "gpt" | "wan" | "kling" | "cinema";
  className?: string;
  size?: "hero" | "tall" | "wide" | "default";
};

const VISUALS: Record<BentoTileProps["visual"], { src: string; alt: string }> = {
  seedance: { src: "/cinema-1.jpg", alt: "Seedance cinematic preview" },
  gpt: { src: "/enhanced-1.jpg", alt: "GPT Image 2 preview" },
  wan: { src: "/identity-1.jpg", alt: "Wan 2.7 video preview" },
  kling: { src: "/influencer-1.jpg", alt: "Kling 3.0 Pro preview" },
  cinema: { src: "/cinema-1.jpg", alt: "Video studio preview" }
};

function badgeClass(tone: BentoTileProps["badgeTone"]) {
  switch (tone) {
    case "pink":
      return "bg-[#ff4fd8]/90 text-white";
    case "cyan":
      return "bg-[#00e5ff]/90 text-black";
    default:
      return "bg-[#c8ff00] text-black";
  }
}

function BentoTile({
  href,
  title,
  headline,
  subtitle,
  badge,
  badgeTone = "lime",
  visual,
  className,
  size = "default"
}: BentoTileProps) {
  const { src, alt } = VISUALS[visual];

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
        className="group relative flex h-full min-h-[inherit] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101018] transition-all duration-300 hover:border-[#c8ff00]/35 hover:shadow-[0_0_40px_rgba(200,255,0,0.08)]"
      >
        <Image
          src={src}
          alt={alt}
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#c8ff00]/[0.06] via-transparent to-[#8338eb]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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
              <p className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-[#c8ff00] sm:text-base">
                {title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55 sm:text-sm">
                {subtitle}
              </p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition-colors group-hover:border-[#c8ff00]/50 group-hover:text-[#c8ff00]">
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
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[#c8ff00]">
            Zorixa studio
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Viral presets<span className="text-[#c8ff00]">.</span>
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/45">
            Photo &amp; video — Seedance 2.0, GPT Image 2, Wan 2.7, Kling 3.0 Pro. One click into the studio.
          </p>
        </div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101018] px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-[#c8ff00]/40 hover:text-[#c8ff00]"
        >
          All tools
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <BentoTile
          href={seedanceI2v}
          size="hero"
          visual="seedance"
          badge="VIDEO + IMAGE"
          badgeTone="lime"
          headline="SEEDANCE"
          title="Seedance 2.0"
          subtitle="Image to Video · Text to Video · Reference clips — Atlas Cloud."
        />

        <BentoTile
          href={gptImage}
          size="tall"
          visual="gpt"
          badge="NEW"
          badgeTone="pink"
          headline="GPT"
          title="GPT Image 2"
          subtitle="Instruction-tuned stills for ads, UI, and campaign frames."
        />

        <BentoTile
          href={wanT2v}
          size="wide"
          visual="wan"
          badge="VIDEO"
          badgeTone="cyan"
          title="Wan 2.7"
          subtitle="Multi-shot T2V · I2V · Reference — up to 15s, native audio."
        />

        <BentoTile
          href={klingI2v}
          size="default"
          visual="kling"
          badge="PRO"
          badgeTone="pink"
          title="Kling 3.0 Pro"
          subtitle="Premium I2V & T2V · 3–15s · end frame."
        />

        <BentoTile
          href={seedanceT2v}
          size="default"
          visual="cinema"
          badge="T2V"
          title="Seedance T2V"
          subtitle="Fast text-to-video iterations."
        />

        <BentoTile
          href={seedanceR2v}
          size="default"
          visual="seedance"
          badge="R2V"
          title="Seedance refs"
          subtitle="Up to 9 images · 3 videos · 3 audios."
        />

        <BentoTile
          href={wanI2v}
          size="default"
          visual="wan"
          title="Wan I2V"
          subtitle="Animate stills with end-frame support."
        />

        <BentoTile
          href={klingT2v}
          size="default"
          visual="kling"
          title="Kling T2V"
          subtitle="Cinematic text prompts · aspect 16:9 / 9:16 / 1:1."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/image"
          className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#101018] px-4 py-3 transition-colors hover:border-[#c8ff00]/30"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-[#c8ff00]/10 text-[#c8ff00]">
            <ImageIcon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Image studio</p>
            <p className="text-xs text-white/45">Flux · Seedream · Wan image</p>
          </div>
        </Link>
        <Link
          href="/video"
          className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#101018] px-4 py-3 transition-colors hover:border-[#c8ff00]/30"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-[#c8ff00]/10 text-[#c8ff00]">
            <Clapperboard className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Video studio</p>
            <p className="text-xs text-white/45">All Atlas video models</p>
          </div>
        </Link>
        <Link
          href="/dashboard/enhance"
          className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#101018] px-4 py-3 transition-colors hover:border-[#c8ff00]/30"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-[#8338eb]/15 text-[#c8ff00]">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Enhance</p>
            <p className="text-xs text-white/45">Upscale &amp; retouch stills</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
