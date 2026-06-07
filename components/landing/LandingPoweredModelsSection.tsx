"use client";

import { motion } from "framer-motion";

import { ModelBrandLogo } from "@/components/ui/ModelBrandLogo";
import { cn } from "@/lib/utils";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }
};

const VIDEO_MODELS = [
  { id: "seedance-2", label: "Seedance 2.0" },
  { id: "seedance-1-5-pro", label: "Seedance 1.5 Pro" },
  { id: "kling-3-pro", label: "Kling 3.0 Pro" },
  { id: "google-veo-3-1", label: "Google Veo 3.1" },
  { id: "wan-2-6", label: "Wan 2.6" },
  { id: "wan-2-7", label: "Wan 2.7" },
  { id: "hailuo-2-3", label: "Hailuo 2.3" },
  { id: "vidu-q3", label: "Vidu Q3" },
  { id: "vidu-q3-pro", label: "Vidu Q3 Pro" },
  { id: "happyhorse-1", label: "HappyHorse 1.0" }
] as const;

const IMAGE_MODELS = [
  { id: "flux-dev", label: "Flux Pro" },
  { id: "flux-kontext-dev", label: "Flux Kontext" },
  { id: "gemini-omni-flash-t2v", label: "Gemini Omni Flash" },
  { id: "grok-imagine", label: "Grok Imagine" }
] as const;

function PoweredModelCard({ composerId, label }: { composerId: string; label: string }) {
  return (
    <motion.div
      variants={reveal}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.03] p-4",
        "shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur"
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,209,255,0.16),transparent_55%)]" />
      </div>
      <div className="relative flex min-w-0 items-center gap-3">
        <ModelBrandLogo composerId={composerId} />
        <span className="truncate text-sm font-semibold text-white">{label}</span>
      </div>
    </motion.div>
  );
}

function ModelCategory({ title, models }: { title: string; models: readonly { id: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a1a1aa]">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <PoweredModelCard key={m.id} composerId={m.id} label={m.label} />
        ))}
      </div>
    </div>
  );
}

export function LandingPoweredModelsSection() {
  return (
    <section id="models" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-90px" }}>
        <motion.div variants={reveal} className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">Models</p>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tighter sm:text-4xl">
            Powered by Leading AI Models
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
            Access industry-leading AI models from a single platform.
          </p>
        </motion.div>

        <motion.div variants={reveal} className="space-y-10">
          <ModelCategory title="Video Generation Models" models={VIDEO_MODELS} />
          <ModelCategory title="Image Generation Models" models={IMAGE_MODELS} />
        </motion.div>
      </motion.div>
    </section>
  );
}
