import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AlternativePageView } from "@/components/alternative-pages/AlternativePageView";
import { getAlternativePageBySlug } from "@/lib/alternative-pages";
import { absoluteUrl } from "@/lib/site-brand";

const SLUG = "creatify-alternative";

export function generateMetadata(): Metadata {
  const page = getAlternativePageBySlug(SLUG);
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

export default function CreatifyAlternativePage() {
  const page = getAlternativePageBySlug(SLUG);
  if (!page) notFound();
  return <AlternativePageView page={page} />;
}
