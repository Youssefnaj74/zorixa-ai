import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModelSeoLanding } from "@/components/models/ModelSeoLanding";
import { getAllModelSeoSlugs, getModelSeoPage } from "@/lib/model-seo-catalog";
import { absoluteUrl } from "@/lib/site-brand";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllModelSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getModelSeoPage(slug);
  if (!page) return { title: "Model not found" };

  const title = `${page.name} — AI Video Generator`;
  const url = absoluteUrl(`/models/${page.slug}`);

  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · Zorixa AI`,
      description: page.description,
      url,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Zorixa AI`,
      description: page.description
    }
  };
}

export default async function ModelSeoPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = getModelSeoPage(slug);
  if (!page) notFound();
  return <ModelSeoLanding page={page} />;
}
