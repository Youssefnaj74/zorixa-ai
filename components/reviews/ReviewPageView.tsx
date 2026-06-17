import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ThumbsDown, ThumbsUp } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { ReviewPageJsonLd } from "@/components/seo/review-page-json-ld";
import {
  creditsChargedForVideoModel,
  formatGenerationCreditsLine
} from "@/lib/atlas-pricing-catalog";
import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";
import { resolveModelLogoPath } from "@/lib/model-logos";
import { getModelReviewPage, type ModelReviewPage } from "@/lib/review-pages-catalog";
import { getVideoModelShowcase } from "@/lib/video-model-showcase";

const NAV_H = 56;

function showcaseTab(page: ModelReviewPage): "Text to Video" | "Image to Video" {
  return page.studioSectionId === "reference-to-video" ? "Text to Video" : "Text to Video";
}

export function ReviewPageView({ page }: { page: ModelReviewPage }) {
  const studioHref = buildCatalogStudioHref(page.studioSectionId, page.composerModelId, {
    toolName: page.name
  });
  const logoPath = resolveModelLogoPath(page.composerModelId);
  const showcase = getVideoModelShowcase(page.composerModelId, showcaseTab(page));
  const credits = formatGenerationCreditsLine(creditsChargedForVideoModel(page.composerModelId));

  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <ReviewPageJsonLd page={page} />
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <nav className="text-xs text-white/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70">
              Home
            </Link>
            {" / "}
            <Link href="/reviews" className="hover:text-white/70">
              Reviews
            </Link>
            {" / "}
            <span className="text-white/70">{page.name}</span>
          </nav>

          <div className="mt-8 flex flex-wrap items-start gap-4">
            {logoPath ? (
              <Image
                src={logoPath}
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-xl bg-white/5 object-contain p-1.5"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">
                {page.provider} · Editorial review
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {page.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white/55">{page.description}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-brand/25 bg-brand/10 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7ee9ff]">Verdict</p>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">{page.verdict}</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-300">
                <ThumbsUp className="size-4" aria-hidden />
                Pros
              </h2>
              <ul className="mt-4 space-y-2">
                {page.pros.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-white/70">
                    — {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-rose-300">
                <ThumbsDown className="size-4" aria-hidden />
                Cons
              </h2>
              <ul className="mt-4 space-y-2">
                {page.cons.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-white/70">
                    — {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {showcase ? (
            <section className="mt-12">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Example output</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <video
                  src={showcase.videoUrl}
                  poster={showcase.posterUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-contain"
                />
                <p className="border-t border-white/10 px-4 py-3 text-xs text-white/50">
                  <span className="font-medium text-white/70">Prompt: </span>
                  {showcase.prompt}
                </p>
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Pricing on Zorixa AI</h2>
            <p className="mt-3 text-sm text-white/60">
              From <span className="font-semibold text-white">{credits}</span> per typical 5s generation
              (model and settings vary).
            </p>
            <ul className="mt-4 space-y-2">
              {page.pricingNotes.map((note) => (
                <li key={note} className="text-sm leading-relaxed text-white/65">
                  — {note}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Link href="/pricing" className="text-sm text-[#00e5ff] hover:underline">
                View Zorixa pricing →
              </Link>
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Comparison</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">{page.comparisonSummary}</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Model</th>
                    <th className="px-4 py-3 font-semibold">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {page.comparisonRows.map((row) => (
                    <tr key={row.model} className="border-t border-white/10">
                      <td className="px-4 py-3 font-medium text-white/80">{row.model}</td>
                      <td className="px-4 py-3 text-white/65">{row.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-brand/30 bg-brand/10 px-6 py-8 text-center">
            <h2 className="text-xl font-bold text-white">Try {page.name} on Zorixa AI</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
              No separate API signup — open the studio with {page.name} pre-selected.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={studioHref}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
              >
                Generate now
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={`/models/${page.modelPageSlug}`}
                className="inline-flex rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white/80 hover:border-white/30"
              >
                Model specs
              </Link>
            </div>
          </section>

          {page.relatedReviewSlugs.length ? (
            <section className="mt-12 border-t border-white/10 pt-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">More reviews</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {page.relatedReviewSlugs.map((slug) => {
                  const related = getModelReviewPage(slug);
                  if (!related) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/reviews/${slug}`}
                        className="inline-flex rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 hover:border-white/30"
                      >
                        {related.name} review
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {page.relatedBlogSlugs.length ? (
            <p className="mt-8 text-sm text-white/40">
              Guides:{" "}
              {page.relatedBlogSlugs.map((slug, i) => (
                <span key={slug}>
                  {i > 0 ? " · " : null}
                  <Link href={`/blog/${slug}`} className="text-[#00e5ff] hover:underline">
                    {slug.replace(/-/g, " ")}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
