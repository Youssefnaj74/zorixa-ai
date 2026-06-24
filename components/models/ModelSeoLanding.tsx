import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ModelSeoJsonLd } from "@/components/seo/model-seo-json-ld";
import { Navbar } from "@/components/layout/Navbar";
import {
  creditsChargedForVideoModel,
  formatGenerationCreditsLine
} from "@/lib/atlas-pricing-catalog";
import {
  MODEL_CAPABILITY_LABELS,
  modelSeoStudioHref,
  type ModelSeoPage
} from "@/lib/model-seo-catalog";
import { modelSeoHeroAlt } from "@/lib/image-alt-text";
import { getVideoModelShowcase } from "@/lib/video-model-showcase";
import { resolveModelLogoPath } from "@/lib/model-logos";

const NAV_H = 56;

function primaryShowcaseTab(page: ModelSeoPage): "Text to Video" | "Image to Video" {
  if (page.capabilities.includes("text-to-video")) return "Text to Video";
  if (page.capabilities.includes("image-to-video")) return "Image to Video";
  return "Text to Video";
}

export function ModelSeoLanding({ page }: { page: ModelSeoPage }) {
  const studioHref = modelSeoStudioHref(page);
  const logoPath = resolveModelLogoPath(page.composerModelId);
  const showcase = getVideoModelShowcase(page.composerModelId, primaryShowcaseTab(page));
  const credits =
    page.category === "video"
      ? formatGenerationCreditsLine(creditsChargedForVideoModel(page.composerModelId))
      : null;

  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <ModelSeoJsonLd page={page} />
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <nav className="text-xs text-white/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70">
              Home
            </Link>
            {" / "}
            <Link href="/models" className="hover:text-white/70">
              Models
            </Link>
            {" / "}
            <span className="text-white/70">{page.name}</span>
          </nav>

          <div className="mt-8 flex flex-wrap items-start gap-4">
            {logoPath ? (
              <Image
                src={logoPath}
                alt={modelSeoHeroAlt(page.name)}
                width={48}
                height={48}
                className="size-12 rounded-xl bg-white/5 object-contain p-1.5"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">
                {page.provider} · {page.category === "video" ? "Video model" : "Image model"}
              </p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {page.name}
              </h1>
              <p className="mt-2 text-lg font-medium text-white/80">{page.tagline}</p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">{page.heroSubtitle}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={studioHref}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Generate now
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              View pricing
            </Link>
            {credits ? (
              <span className="text-sm text-white/45">From {credits} per run (typical 5s)</span>
            ) : null}
          </div>

          <section className="mt-14">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Capabilities</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {page.capabilities.map((cap) => (
                <li
                  key={cap}
                  className="rounded-full border border-[#00e5ff]/25 bg-[#00e5ff]/10 px-3 py-1.5 text-xs font-semibold text-[#7ee9ff]"
                >
                  {MODEL_CAPABILITY_LABELS[cap]}
                </li>
              ))}
            </ul>
          </section>

          {showcase ? (
            <section className="mt-14">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Example</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <video
                  src={showcase.videoUrl}
                  poster={showcase.posterUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-contain"
                />
                <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-white/50">
                  <span className="font-medium text-white/70">Prompt: </span>
                  {showcase.prompt}
                </p>
              </div>
            </section>
          ) : null}

          <section className="mt-14">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Features</h2>
            <ul className="mt-4 space-y-3">
              {page.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <span className="mt-1 text-[#00e5ff]" aria-hidden>
                    —
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {page.compareRows?.length ? (
            <section className="mt-14">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">At a glance</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Spec</th>
                      <th className="px-4 py-3 font-semibold">On Zorixa AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.compareRows.map((row) => (
                      <tr key={row.label} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium text-white/80">{row.label}</td>
                        <td className="px-4 py-3 text-white/65">
                          {row.zorixa}
                          {row.note ? (
                            <span className="mt-0.5 block text-xs text-white/40">{row.note}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="mt-14">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">FAQ</h2>
            <dl className="mt-4 space-y-6">
              {page.faq.map((item) => (
                <div key={item.q}>
                  <dt className="text-base font-semibold text-white">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/65">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-14 rounded-2xl border border-brand/30 bg-brand/10 px-6 py-8 text-center sm:px-10">
            <h2 className="text-xl font-bold text-white">Try {page.name} on Zorixa AI</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
              Open the studio with {page.name} pre-selected — no separate API account required.
            </p>
            <Link
              href={studioHref}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Generate now
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>

          <p className="mt-10 text-sm text-white/40">
            <Link href="/models" className="text-[#00e5ff] hover:underline">
              All models
            </Link>
            {" · "}
            <Link href="/tools" className="text-[#00e5ff] hover:underline">
              Tools catalog
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
