"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { ModelBrandLogo } from "@/components/ui/ModelBrandLogo";
import { cn } from "@/lib/utils";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }
};

type ShowcaseExample = {
  id: string;
  category: string;
  title: string;
  beforePoints: string[];
  afterPoints: string[];
  beforeUrl: string;
  afterUrl: string;
  beforeAlt: string;
  afterAlt: string;
};

/** Generated via: npm run generate:landing-gallery → public/landing-gallery/ */
const EXAMPLES: ShowcaseExample[] = [
  {
    id: "ugc",
    category: "UGC Creator",
    title: "AI Influencer · UGC quality",
    beforePoints: ["Plain studio input", "Generic AI look", "Flat lighting"],
    afterPoints: ["Natural skin texture", "Facial detail", "Cinematic lighting"],
    beforeUrl: "/landing-gallery/ugc/before.png",
    afterUrl: "/landing-gallery/ugc/after.png",
    beforeAlt: "Before — generic AI influencer look",
    afterAlt: "After — UGC creator with cinematic lighting"
  },
  {
    id: "enhancement",
    category: "Image Enhancement",
    title: "Sharper, cleaner output",
    beforePoints: ["Soft detail", "Flat contrast", "Low polish"],
    afterPoints: ["Sharp detail", "Clean finish", "Professional look"],
    beforeUrl: "/landing-gallery/enhancement/before.png",
    afterUrl: "/landing-gallery/enhancement/after.png",
    beforeAlt: "Before — soft low-detail portrait",
    afterAlt: "After — enhanced sharp professional portrait"
  },
  {
    id: "consistency",
    category: "Character Consistency",
    title: "Same identity across shots",
    beforePoints: ["Face shifts between frames", "Identity drift", "Inconsistent features"],
    afterPoints: ["Same person every frame", "Stable identity", "Campaign-ready"],
    beforeUrl: "/landing-gallery/consistency/before.png",
    afterUrl: "/landing-gallery/consistency/after.png",
    beforeAlt: "Before — identity drift across frames",
    afterAlt: "After — consistent AI influencer identity"
  },
  {
    id: "character-swap",
    category: "Character Swap",
    title: "New face · same scene",
    beforePoints: ["Original subject", "Fixed scene & motion", "Source frame"],
    afterPoints: ["Swapped character", "Scene preserved", "Natural motion match"],
    beforeUrl: "/landing-gallery/character-swap/before.png",
    afterUrl: "/landing-gallery/character-swap/after.png",
    beforeAlt: "Before — original UGC subject frame",
    afterAlt: "After — character swap result"
  }
];

const SHOWCASE_VIDEOS = [
  {
    id: "ugc-grok",
    modelId: "grok-imagine-video-i2v-15",
    label: "UGC Video · Grok Imagine",
    poster: "/video-showcases/i2v/grok-imagine-video-i2v-15-start.png",
    src: "/video-showcases/i2v/grok-imagine-video-i2v-15.mp4"
  },
  {
    id: "ugc-hailuo",
    modelId: "hailuo-2-3",
    label: "UGC Video · Hailuo 2.3",
    poster: "/video-showcases/i2v/hailuo-2-3-start.png",
    src: "/video-showcases/i2v/hailuo-2-3.mp4"
  },
  {
    id: "cinematic-seedance",
    modelId: "seedance-2",
    label: "Cinematic · Seedance 2.0",
    poster: "/video-showcases/i2v/seedance-2-start.png",
    src: "/video-showcases/i2v/seedance-2.mp4"
  },
  {
    id: "cinematic-vidu",
    modelId: "vidu-q3-pro",
    label: "Cinematic · Vidu Q3 Pro",
    poster: "/video-showcases/i2v/vidu-q3-pro-start.png",
    src: "/video-showcases/i2v/vidu-q3-pro.mp4"
  }
] as const;

function StatusBadge({ kind }: { kind: "before" | "after" }) {
  const isBefore = kind === "before";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
        isBefore
          ? "border-red-500/35 bg-red-500/10 text-red-300"
          : "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
      )}
    >
      <span className={cn("size-1.5 rounded-full", isBefore ? "bg-red-400" : "bg-emerald-400")} aria-hidden />
      {isBefore ? "Before" : "After"}
    </span>
  );
}

function CompareImage({ src, alt, label }: { src: string; alt: string; label: "before" | "after" }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2">
        <StatusBadge kind={label} />
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.10] bg-black sm:aspect-[3/4]">
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 45vw" className="object-cover" />
      </div>
    </div>
  );
}

function ShowcaseCard({ example }: { example: ShowcaseExample }) {
  return (
    <motion.div variants={reveal} className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#00d1ff]">{example.category}</p>
        <h3 className="mt-1 text-sm font-semibold text-white">{example.title}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ul className="space-y-1 text-xs text-[#a1a1aa]">
          {example.beforePoints.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-red-400" aria-hidden>
                —
              </span>
              {p}
            </li>
          ))}
        </ul>
        <ul className="space-y-1 text-xs text-[#a1a1aa]">
          {example.afterPoints.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-emerald-400" aria-hidden>
                +
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <CompareImage src={example.beforeUrl} alt={example.beforeAlt} label="before" />
        <div className="flex shrink-0 items-center justify-center text-[#00d1ff]" aria-hidden>
          <ArrowRight className="size-5 rotate-90 sm:rotate-0" />
        </div>
        <CompareImage src={example.afterUrl} alt={example.afterAlt} label="after" />
      </div>
    </motion.div>
  );
}

export function LandingGenerationsGallery() {
  return (
    <section id="gallery" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-90px" }}>
        <motion.div variants={reveal} className="mb-8 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">Real generations</p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tighter sm:text-4xl">
            Before &amp; after — made on ZorixaAI
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
            UGC creators, image enhancement, character consistency, and character swap — actual outputs from our
            studio.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {EXAMPLES.map((example) => (
            <ShowcaseCard key={example.id} example={example} />
          ))}
        </div>

        <motion.div variants={reveal} className="mt-10">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a1a1aa]">Video samples</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {SHOWCASE_VIDEOS.map((item) => (
              <motion.div
                key={item.src}
                variants={reveal}
                className="overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.03] shadow-[0_18px_55px_rgba(0,0,0,0.55)]"
              >
                <div className="relative aspect-[9/16] bg-black">
                  <video
                    src={item.src}
                    poster={item.poster}
                    className="size-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
                <div className="flex items-center gap-2.5 px-3 py-3 sm:px-4">
                  <ModelBrandLogo composerId={item.modelId} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00d1ff] sm:text-xs sm:tracking-[0.18em]">
                    {item.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
