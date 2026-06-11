"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { ModelBrandLogo } from "@/components/ui/ModelBrandLogo";
import { cn } from "@/lib/utils";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }
};

const VIDEO_MODES = [
  "AI Director",
  "Text to Video",
  "Image to Video",
  "Reference to Video",
  "Video to Video",
  "Audio to Video"
] as const;

const IMAGE_MODES = ["Text to Image", "Image to Image"] as const;

const VIDEO_POWERED_MODELS = [
  { id: "seedance-2", label: "Seedance 2.0" },
  { id: "kling-3-pro", label: "Kling 3.0 Pro" },
  { id: "google-veo-3-1", label: "Google Veo 3.1" },
  { id: "wan-2-7", label: "Wan 2.7" },
  { id: "vidu-q3", label: "Vidu Q3" },
  { id: "hailuo-2-3", label: "Hailuo 2.3" }
] as const;

const IMAGE_POWERED_MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2" },
  { id: "nano-banana-pro", label: "Nano Banana Pro" },
  { id: "flux-dev", label: "Flux Pro" },
  { id: "grok-imagine", label: "Grok Imagine" }
] as const;

function PoweredByRow({ models }: { models: readonly { id: string; label: string }[] }) {
  return (
    <div className="border-t border-white/[0.08] px-5 py-3 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">Powered by</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {models.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-black/40 px-2.5 py-1"
          >
            <ModelBrandLogo composerId={m.id} />
            <span className="text-[11px] font-medium text-white/90">{m.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ModePill({ label, accent }: { label: string; accent: "cyan" | "violet" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.14em]",
        accent === "cyan"
          ? "border-[#00d1ff]/30 bg-[#00d1ff]/10 text-[#7ee9ff]"
          : "border-violet-400/30 bg-violet-400/10 text-violet-200"
      )}
    >
      {label}
    </span>
  );
}

function StudioPanel({
  eyebrow,
  title,
  body,
  href,
  cta,
  imageSrc,
  imageAlt,
  modes,
  accent,
  poweredBy
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  imageSrc: string;
  imageAlt: string;
  modes: readonly string[];
  accent: "cyan" | "violet";
  poweredBy: readonly { id: string; label: string }[];
}) {
  return (
    <motion.div
      variants={reveal}
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.03]",
        "shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur"
      )}
    >
      <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00d1ff]">{eyebrow}</p>
        <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">{body}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {modes.map((mode) => (
            <ModePill key={mode} label={mode} accent={accent} />
          ))}
        </div>
      </div>

      <div className="relative bg-black/50 p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.10] bg-[#0a0a0f]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1920}
            height={1080}
            className="h-auto w-full"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>
        <PoweredByRow models={poweredBy} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-4 sm:px-6">
        <p className="text-xs text-[#a1a1aa]">20+ models · one workspace · pay per credit</p>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#00d1ff] transition-colors hover:text-white"
        >
          {cta}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </motion.div>
  );
}

export function LandingProductStudioSection() {
  return (
    <section id="studio" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-90px" }}>
        <motion.div variants={reveal} className="mb-8 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">One workspace</p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tighter sm:text-4xl">
            Simple interface. Every model. Every workflow.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
            Image and video in one place — pick a mode, choose your model, generate. No switching tools, no fake
            complexity.
          </p>
        </motion.div>

        <motion.div variants={reveal} className="mb-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00d1ff]/25 bg-[#00d1ff]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7ee9ff]">
            <Sparkles className="size-3.5" aria-hidden />
            All modes included
          </span>
          <span className="text-xs text-[#a1a1aa]">Same UI for image &amp; video — credits shown before you generate</span>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-1">
          <StudioPanel
            eyebrow="Video studio"
            title="One Platform. Every Video Workflow."
            body="From AI Director to Character Swap — every video mode lives in the same composer. Model, aspect, duration, and credits upfront."
            href="/video"
            cta="Try video studio"
            imageSrc="/dashboard-assets/dashboard-video-studio.png?v=20260611"
            imageAlt="ZorixaAI video studio with Text to Video, Image to Video, Character Swap and more"
            modes={VIDEO_MODES}
            accent="cyan"
            poweredBy={VIDEO_POWERED_MODELS}
          />
          <StudioPanel
            eyebrow="Image studio"
            title="Text to Image & Image to Image"
            body="Generate from a prompt or edit an existing photo — same clean layout, same model picker, same credit transparency."
            href="/image"
            cta="Try image studio"
            imageSrc="/dashboard-assets/dashboard-image-studio.png?v=20260611"
            imageAlt="ZorixaAI image studio with Text to Image and Image to Image tabs"
            modes={IMAGE_MODES}
            accent="violet"
            poweredBy={IMAGE_POWERED_MODELS}
          />
        </div>
      </motion.div>
    </section>
  );
}
