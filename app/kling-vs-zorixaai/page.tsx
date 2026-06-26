import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VersusPageView } from "@/components/comparison-pages/VersusPageView";
import { getVersusPageBySlug } from "@/lib/comparison-pages";
import { absoluteUrl } from "@/lib/site-brand";

const SLUG = "kling-vs-zorixaai";

export function generateMetadata(): Metadata {
  const page = getVersusPageBySlug(SLUG);
  if (!page) return { title: "Page not found" };

  const url = absoluteUrl(page.path);

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} · Zorixa AI`,
      description: page.description,
      url,
      type: "article",
      publishedTime: page.publishedAt,
      modifiedTime: page.publishedAt,
      tags: page.keywords
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} · Zorixa AI`,
      description: page.description
    }
  };
}

export default function KlingVsZorixaPage() {
  const page = getVersusPageBySlug(SLUG);
  if (!page) notFound();
  return <VersusPageView page={page} />;
}
