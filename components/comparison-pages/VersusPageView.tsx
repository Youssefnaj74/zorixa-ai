import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { Navbar } from "@/components/layout/Navbar";
import { VersusPageJsonLd } from "@/components/seo/versus-page-json-ld";
import { splitBlogInlineLinks } from "@/lib/blog";
import type { BlogSection } from "@/lib/blog/types";
import type { AlternativeComparisonRow } from "@/lib/alternative-pages/types";
import type { VersusSeoPage } from "@/lib/comparison-pages/types";

const NAV_H = 56;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function InlineRichText({ text }: { text: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {segments.map((segment, i) => {
        if (segment.startsWith("**") && segment.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white/85">
              {segment.slice(2, -2)}
            </strong>
          );
        }
        const parts = splitBlogInlineLinks(segment);
        return parts.map((part, j) =>
          part.type === "link" && part.href ? (
            <Link key={`${i}-${j}`} href={part.href} className="text-[#00e5ff] hover:underline">
              {part.value}
            </Link>
          ) : (
            <span key={`${i}-${j}`}>{part.value}</span>
          )
        );
      })}
    </>
  );
}

function SectionContent({ section }: { section: BlogSection }) {
  const Tag = section.level === 3 ? "h3" : "h2";
  const tagClass =
    section.level === 3
      ? "mt-8 text-lg font-bold text-white"
      : "mt-12 scroll-mt-24 text-xl font-bold text-white sm:text-2xl";

  return (
    <section id={section.id} aria-labelledby={`${section.id}-heading`}>
      <Tag id={`${section.id}-heading`} className={tagClass}>
        {section.title}
      </Tag>
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
          <InlineRichText text={p} />
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="mt-4 list-none space-y-2 pl-0">
          {section.bullets.map((item) => (
            <li key={item.slice(0, 48)} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
              <span className="mt-1 text-[#00e5ff]" aria-hidden>
                —
              </span>
              <span>
                <InlineRichText text={item} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ComparisonTable({
  rows,
  competitorName
}: {
  rows: AlternativeComparisonRow[];
  competitorName: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-white/45">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Dimension
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              {competitorName}
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              ZorixaAI
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-t border-white/10 align-top">
              <th scope="row" className="px-4 py-3 font-medium text-white/80">
                {row.feature}
              </th>
              <td className="px-4 py-3 text-white/65">
                <InlineRichText text={row.competitor} />
              </td>
              <td className="px-4 py-3 text-white/65">
                <InlineRichText text={row.zorixa} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WhoBlock({
  title,
  paragraphs,
  bullets
}: {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-white/70">
          <InlineRichText text={p} />
        </p>
      ))}
      {bullets?.length ? (
        <ul className="mt-4 list-none space-y-2">
          {bullets.map((item) => (
            <li key={item.slice(0, 48)} className="flex items-start gap-2 text-sm text-white/70">
              <span className="mt-1 text-[#00e5ff]" aria-hidden>
                —
              </span>
              <span>
                <InlineRichText text={item} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function VersusPageView({ page }: { page: VersusSeoPage }) {
  const tocSections: BlogSection[] = [
    { id: "quick-verdict", title: "Quick verdict", level: 2, paragraphs: [] },
    { id: "comparison-table", title: "Comparison table", level: 2, paragraphs: [] },
    ...page.sections,
    { id: "who-should-choose", title: "Who should choose", level: 2, paragraphs: [] },
    { id: "faq", title: "FAQ", level: 2, paragraphs: [] }
  ];

  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <VersusPageJsonLd page={page} />
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <nav className="text-xs text-white/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70">
              Home
            </Link>
            {" / "}
            <span className="text-white/70">{page.competitorName} vs ZorixaAI</span>
          </nav>

          <header className="mt-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">{page.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">{page.description}</p>
            <p className="mt-4 text-sm text-white/40">
              {formatDate(page.publishedAt)} · {page.readingTimeMinutes} min read
            </p>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
            <article className="min-w-0 max-w-3xl">
              <section id="quick-verdict" aria-labelledby="quick-verdict-heading" className="scroll-mt-24">
                <h2 id="quick-verdict-heading" className="text-xl font-bold text-white sm:text-2xl">
                  Quick verdict
                </h2>
                <div className="mt-4 space-y-4 rounded-2xl border border-[#00e5ff]/20 bg-[#00e5ff]/5 p-6">
                  {page.quickVerdict.map((p) => (
                    <p key={p.slice(0, 48)} className="text-sm leading-relaxed text-white/75 sm:text-base">
                      <InlineRichText text={p} />
                    </p>
                  ))}
                </div>
              </section>

              <section id="comparison-table" aria-labelledby="comparison-table-heading" className="mt-12 scroll-mt-24">
                <h2 id="comparison-table-heading" className="text-xl font-bold text-white sm:text-2xl">
                  {page.competitorName} vs ZorixaAI comparison table
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                  Side-by-side summary for{" "}
                  <strong className="font-semibold text-white/85">Kling AI vs ZorixaAI</strong>. Open the{" "}
                  <Link href="/video" className="text-[#00e5ff] hover:underline">
                    video studio
                  </Link>{" "}
                  to validate on your prompts.
                </p>
                <div className="mt-6">
                  <ComparisonTable rows={page.comparisonTable} competitorName={page.competitorName} />
                </div>
              </section>

              {page.sections.map((section) => (
                <SectionContent key={section.id} section={section} />
              ))}

              <section
                id="who-should-choose"
                aria-labelledby="who-should-choose-heading"
                className="mt-14 scroll-mt-24"
              >
                <h2 id="who-should-choose-heading" className="text-xl font-bold text-white sm:text-2xl">
                  Who should choose which platform
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <WhoBlock {...page.whoCompetitor} />
                  <WhoBlock {...page.whoZorixa} />
                </div>
              </section>

              <section id="faq" aria-labelledby="faq-heading" className="mt-14 scroll-mt-24">
                <h2 id="faq-heading" className="text-sm font-bold uppercase tracking-widest text-white/50">
                  FAQ
                </h2>
                <dl className="mt-4 space-y-6">
                  {page.faq.map((item) => (
                    <div key={item.question}>
                      <dt className="text-base font-semibold text-white">{item.question}</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-white/65">
                        <InlineRichText text={item.answer} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="mt-14 rounded-2xl border border-brand/30 bg-brand/10 px-6 py-8 text-center sm:px-10">
                <h2 className="text-xl font-bold text-white">{page.ctaTitle}</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
                  <InlineRichText text={page.ctaBody} />
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={page.ctaHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {page.ctaLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={page.secondaryCtaHref}
                    className="inline-flex rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white/80 hover:border-white/30"
                  >
                    {page.secondaryCtaLabel}
                  </Link>
                </div>
              </section>

              <p className="mt-10 text-sm text-white/40">
                <Link href="/kling-ai-alternative" className="text-[#00e5ff] hover:underline">
                  Kling AI alternative
                </Link>
                {" · "}
                <Link href="/models/kling-3-pro" className="text-[#00e5ff] hover:underline">
                  Kling 3 Pro
                </Link>
                {" · "}
                <Link href="/blog/seedance-2-vs-kling-3-pro" className="text-[#00e5ff] hover:underline">
                  Seedance vs Kling
                </Link>
                {" · "}
                <Link href="/pricing" className="text-[#00e5ff] hover:underline">
                  Pricing
                </Link>
              </p>
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <BlogTableOfContents sections={tocSections} />
              </div>
            </aside>
          </div>

          <div className="mt-10 lg:hidden">
            <BlogTableOfContents sections={tocSections} />
          </div>
        </div>
      </main>
    </div>
  );
}
