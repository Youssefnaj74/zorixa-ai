import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/layout/Navbar";
import { MODEL_REVIEW_PAGES } from "@/lib/review-pages-catalog";
import { absoluteUrl } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "AI Video Model Reviews",
  description:
    "Honest reviews of Seedance 2.0, Kling 3 Pro, Hailuo 2.3, and Vidu Q3 on Zorixa AI — pros, cons, pricing, and examples.",
  alternates: { canonical: absoluteUrl("/reviews") }
};

import { NAV_H } from "@/lib/nav-chrome";

export default function ReviewsIndexPage() {
  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <Navbar />
      <main className="min-h-dvh" style={{ paddingTop: NAV_H, minHeight: `calc(100dvh - ${NAV_H}px)` }}>
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">Reviews</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">AI video model reviews</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">
            Editorial reviews with pros, cons, pricing, and comparisons — linked to the Zorixa studio.
          </p>

          <ul className="mt-12 space-y-4">
            {MODEL_REVIEW_PAGES.map((page) => (
              <li
                key={page.slug}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{page.provider}</p>
                <h2 className="mt-1 text-xl font-bold">
                  <Link href={`/reviews/${page.slug}`} className="hover:text-[#00e5ff]">
                    {page.name} review
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-white/55">{page.verdict}</p>
                <Link
                  href={`/reviews/${page.slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-[#00e5ff] hover:underline"
                >
                  Read review →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
