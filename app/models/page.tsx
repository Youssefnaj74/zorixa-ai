import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/layout/Navbar";
import { MODEL_CAPABILITY_LABELS, MODEL_SEO_PAGES, modelSeoStudioHref } from "@/lib/model-seo-catalog";
import { absoluteUrl } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "AI Models — Video & Image Generation",
  description:
    "Browse AI video and image models on Zorixa AI — Seedance 2.0, Kling 3.0 Pro, Hailuo 2.3, Vidu Q3, Gemini Omni Flash, and more.",
  alternates: { canonical: absoluteUrl("/models") }
};

const NAV_H = 56;

export default function ModelsIndexPage() {
  const videoModels = MODEL_SEO_PAGES.filter((p) => p.category === "video");

  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">Model catalog</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">AI models on Zorixa</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">
            SEO-friendly guides for each video model in the studio. Pick a model, read capabilities, and jump
            straight into generation.
          </p>

          <ul className="mt-12 space-y-4">
            {videoModels.map((page) => (
              <li
                key={page.slug}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{page.provider}</p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      <Link href={`/models/${page.slug}`} className="hover:text-[#00e5ff]">
                        {page.name}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-white/55">{page.tagline}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {page.capabilities.slice(0, 3).map((cap) => (
                        <span
                          key={cap}
                          className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50"
                        >
                          {MODEL_CAPABILITY_LABELS[cap]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/models/${page.slug}`}
                      className="rounded-lg border border-white/15 px-4 py-2 text-center text-sm font-medium text-white/80 hover:border-white/30"
                    >
                      Learn more
                    </Link>
                    <Link
                      href={modelSeoStudioHref(page)}
                      className="rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
                    >
                      Generate
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-sm text-white/40">
            <Link href="/tools" className="text-[#00e5ff] hover:underline">
              Full tools catalog
            </Link>
            {" · "}
            <Link href="/video" className="text-[#00e5ff] hover:underline">
              Video studio
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
