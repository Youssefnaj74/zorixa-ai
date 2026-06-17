import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReviewPageView } from "@/components/reviews/ReviewPageView";
import { getAllModelReviewSlugs, getModelReviewPage } from "@/lib/review-pages-catalog";
import { absoluteUrl } from "@/lib/site-brand";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllModelReviewSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getModelReviewPage(slug);
  if (!page) return { title: "Review not found" };

  const url = absoluteUrl(`/reviews/${page.slug}`);

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} · Zorixa AI`,
      description: page.description,
      url,
      type: "article"
    }
  };
}

export default async function ReviewPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = getModelReviewPage(slug);
  if (!page) notFound();
  return <ReviewPageView page={page} />;
}
