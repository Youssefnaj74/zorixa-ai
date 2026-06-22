"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { LandingGenerationsGallery } from "@/components/landing/LandingGenerationsGallery";
import { LandingPoweredModelsSection } from "@/components/landing/LandingPoweredModelsSection";
import { LandingProductStudioSection } from "@/components/landing/LandingProductStudioSection";
import { BrandEmailLink } from "@/components/marketing/BrandEmailLink";
import { ProductHuntBadge } from "@/components/marketing/ProductHuntBadge";
import { ZorixaLogo } from "@/components/layout/ZorixaLogo";
import { BRAND_EMAILS } from "@/lib/site-brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#why", label: "Why ZorixaAI" },
  { href: "#models", label: "Models" },
  { href: "#studio", label: "Studio" },
  { href: "#gallery", label: "Gallery" },
  { href: "/pricing", label: "Pricing", route: true as const }
] as const;

const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }
};

function ZorixaGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-16 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.18),transparent_60%)] blur-2xl" />
      <div className="absolute left-[10%] top-[40%] size-[460px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.12),transparent_60%)] blur-3xl" />
      <div className="absolute right-[8%] top-[36%] size-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.10),transparent_60%)] blur-3xl" />
    </div>
  );
}

function StickyNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/65 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <ZorixaLogo href="/" textClassName="text-base font-semibold" />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV.map((l) =>
            "route" in l && l.route ? (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-[#a1a1aa] transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-[#a1a1aa] transition-colors hover:text-white"
              >
                {l.label}
              </a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login?mode=signup"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#00d1ff] px-5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(0,209,255,0.35),0_0_28px_rgba(0,209,255,0.35)] transition-transform hover:scale-[1.02]"
          >
            Start Free Account
            <ArrowRight className="ml-2 size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function HiggsfieldCard({
  id,
  title,
  eyebrow,
  body
}: {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
}) {
  return (
    <motion.div
      id={id}
      variants={reveal}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.03] p-6",
        "shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur"
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,209,255,0.16),transparent_55%)]" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a1a1aa]">{eyebrow}</p>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-tighter text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">{body}</p>
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#000000] text-white antialiased">
      <StickyNav />

      <main className="relative">
        <ZorixaGlow />

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
            <motion.p
              variants={reveal}
              className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/85"
            >
              UGC Video · AI Influencers · Image Enhancement
            </motion.p>

            <motion.h1
              variants={reveal}
              className="mt-6 font-display text-[clamp(2.6rem,6.2vw,4.7rem)] font-black leading-[0.98] tracking-tighter"
            >
              The New Gold Standard for{" "}
              <span className="bg-[linear-gradient(90deg,#ffffff_0%,#bff6ff_35%,#00d1ff_70%)] bg-clip-text text-transparent">
                AI UGC &amp; Cinema
              </span>
              .
            </motion.h1>

            <motion.p variants={reveal} className="mt-6 max-w-2xl text-base leading-relaxed text-[#a1a1aa] sm:text-lg">
              Create professional AI videos and images with leading models. Generate UGC content, cinematic videos,
              character swaps, and AI-powered visuals from a single platform.
            </motion.p>

            <motion.div variants={reveal} className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login?mode=signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#00d1ff] px-8 text-sm font-bold text-black shadow-[0_0_0_1px_rgba(0,209,255,0.35),0_0_32px_rgba(0,209,255,0.42)] transition-transform hover:scale-[1.02]"
              >
                Start Free Account
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-8 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
              >
                View plans
              </Link>
            </motion.div>

            <motion.div variants={reveal} className="mt-8">
              <ProductHuntBadge />
            </motion.div>
          </motion.div>
        </section>

        {/* Why ZorixaAI */}
        <section id="why" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-90px" }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur shadow-[0_24px_70px_rgba(0,0,0,0.65)] sm:p-10"
          >
            <motion.p variants={reveal} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">
              Why ZorixaAI?
            </motion.p>
            <motion.h2 variants={reveal} className="mt-4 font-display text-3xl font-black tracking-tighter sm:text-4xl">
              One platform for image, video, and UGC
            </motion.h2>
            <motion.ul variants={reveal} className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "One platform.",
                "20+ AI models.",
                "Image + Video + UGC + Character Swap.",
                "Pay only for credits you use."
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-white"
                >
                  <span className="mt-0.5 text-[#00d1ff]" aria-hidden>
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </section>

        <LandingPoweredModelsSection />

        <LandingGenerationsGallery />

        <LandingProductStudioSection />

        {/* Features Grid */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-90px" }}>
            <motion.div variants={reveal} className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">Features</p>
                <h2 className="mt-3 font-display text-3xl font-black tracking-tighter sm:text-4xl">
                  Everything You Need to Create
                </h2>
              </div>
              <span className="hidden h-px w-[180px] bg-gradient-to-r from-[#00e6c8]/40 to-transparent sm:block" aria-hidden />
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: "🎬",
                  title: "UGC Video Studio",
                  body: "Generate hyper-realistic UGC videos with AI influencers in seconds"
                },
                {
                  icon: "👤",
                  title: "AI Influencers",
                  body: "Create consistent AI personas with stable identity across all frames"
                },
                {
                  icon: "🎥",
                  title: "Video Upscale",
                  body: "Upscale finished clips with our Atlas video upscaler for sharper delivery"
                },
                {
                  icon: "🖼️",
                  title: "Image Generation",
                  body: "Photorealistic product images with real skin texture and lighting"
                }
              ].map((f) => (
                <motion.div
                  key={f.title}
                  variants={reveal}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.03] p-6",
                    "shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur"
                  )}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,230,200,0.16),transparent_55%)]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-lg"
                      aria-hidden
                    >
                      {f.icon}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[#00e6c8]/40 to-transparent" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-90px" }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
          >
            <motion.p variants={reveal} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">
              How it works
            </motion.p>
            <motion.h2 variants={reveal} className="mt-4 font-display text-3xl font-black tracking-tighter sm:text-4xl">
              From Prompt to Cinema in 3 Steps
            </motion.h2>

            <motion.div variants={reveal} className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                { n: "01", t: "Upload or Prompt" },
                { n: "02", t: "Choose Your Model" },
                { n: "03", t: "Download & Publish" }
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-white/10 bg-black/35 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-xs font-bold tracking-[0.28em] text-[#00e6c8]">{s.n}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[#00e6c8]/30 to-transparent" aria-hidden />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold tracking-tight text-white">{s.t}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Social proof banner */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-90px" }}>
            <motion.div
              variants={reveal}
              className={cn(
                "flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-center backdrop-blur",
                "shadow-[0_18px_55px_rgba(0,0,0,0.55)] sm:flex-row sm:text-left"
              )}
            >
              <p className="font-display text-sm font-semibold tracking-tight text-white">
                Pay-as-you-go credits <span className="text-white/30">·</span> 20+ models{" "}
                <span className="text-white/30">·</span> Image &amp; video in one workspace
              </p>
              <span className="h-px w-full bg-gradient-to-r from-transparent via-[#00e6c8]/30 to-transparent sm:hidden" aria-hidden />
              <span className="inline-flex items-center rounded-full border border-[rgba(0,230,200,0.35)] bg-[rgba(0,230,200,0.10)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7ff7e8]">
                Premium workflows
              </span>
            </motion.div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-90px" }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-12 text-center backdrop-blur shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,200,0.16),transparent_62%)]" />
            <motion.h2 variants={reveal} className="relative font-display text-3xl font-black tracking-tighter sm:text-4xl">
              Ready to go cinematic?
            </motion.h2>
            <motion.p variants={reveal} className="relative mt-3 text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
              Launch a workflow, pick your model, and ship production-ready visuals in minutes.
            </motion.p>
            <motion.div variants={reveal} className="relative mt-8 flex items-center justify-center">
              <Link
                href="/login?mode=signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#00e6c8] px-8 text-sm font-bold text-black shadow-[0_0_0_1px_rgba(0,230,200,0.35),0_0_34px_rgba(0,230,200,0.38)] transition-transform hover:scale-[1.02]"
              >
                Start Free Account →
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Showcase gallery — legacy cards removed; see Real generations above */}

        {/* Big 3 */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-4 lg:grid-cols-3"
          >
            <HiggsfieldCard
              id="ugc"
              eyebrow="UGC Studio"
              title="Raw reality — without a camera."
              body="Generate hyper-realistic models for e-commerce. No camera, no studio, just raw reality."
            />
            <HiggsfieldCard
              id="influencer"
              eyebrow="AI Influencer Hub"
              title="Identity that never drifts."
              body="Maintain highly consistent identity across frames. Scale your digital persona across campaigns."
            />
            <HiggsfieldCard
              id="cinema"
              eyebrow="Cinema Engine"
              title="Film-grade texture recovery."
              body="Elevate flat AI videos into textured, film-grade masterpieces with natural detail recovery."
            />
          </motion.div>
        </section>

        {/* De-AI */}
        <section id="de-ai" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-90px" }}
            className={cn(
              "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur",
              "shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,209,255,0.16),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(139,92,246,0.10),transparent_55%)]" />

            <motion.p variants={reveal} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a1a1aa]">
              Technical · De-AI
            </motion.p>
            <motion.h2
              variants={reveal}
              className="mt-4 font-display text-3xl font-black tracking-tighter sm:text-4xl"
            >
              The Death of the Plastic Look
            </motion.h2>
            <motion.p variants={reveal} className="mt-4 max-w-3xl text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
              Most AI pipelines flatten reality: skin becomes wax, eyelashes blur into noise, and lighting physics turn
              into smooth gradients. Zorixa is built to restore the cues your audience subconsciously looks for —
              micro-texture, pores, edge detail, specular highlights, and natural shadow falloff — so your results feel
              filmed, not fabricated.
            </motion.p>

            <motion.div variants={reveal} className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { t: "Skin detail recovery", d: "Pores, fine lines, and natural grain — preserved." },
                { t: "Identity consistency", d: "Stable facial features across frames and edits." },
                { t: "Lighting realism", d: "Highlights and shadows that match real-world physics." }
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold tracking-tight text-white">{x.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#a1a1aa]">{x.d}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <footer className="border-t border-white/10 bg-black/60">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-sm font-semibold text-white">Zorixa AI</p>
                <p className="mt-2 text-sm text-[#a1a1aa]">
                  Questions?{" "}
                  <BrandEmailLink email={BRAND_EMAILS.support} className="text-[#00d1ff] hover:text-white" />
                </p>
                <p className="mt-1 text-sm text-[#a1a1aa]">
                  General inquiries:{" "}
                  <BrandEmailLink email={BRAND_EMAILS.contact} className="text-[#00d1ff] hover:text-white" />
                </p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#a1a1aa]">
                <Link className="hover:text-white" href="/pricing">
                  Pricing
                </Link>
                <Link className="hover:text-white" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="hover:text-white" href="/login">
                  Login
                </Link>
                <Link className="hover:text-white" href="/terms">
                  Terms
                </Link>
                <Link className="hover:text-white" href="/acceptable-use">
                  Acceptable Use
                </Link>
                <Link className="hover:text-white" href="/privacy">
                  Privacy
                </Link>
                <Link className="hover:text-white" href="/refund">
                  Refund Policy
                </Link>
              </div>
            </div>
            <p className="mt-8 text-xs text-[#a1a1aa]">© {new Date().getFullYear()} Zorixa AI. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

