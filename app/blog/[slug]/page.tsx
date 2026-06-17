import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticleView } from "@/components/blog/BlogArticleView";
import { getAllBlogSlugs, getBlogPost } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-brand";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Article not found" };

  const url = absoluteUrl(`/blog/${post.slug}`);

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} · Zorixa AI`,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} · Zorixa AI`,
      description: post.description
    }
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return <BlogArticleView post={post} />;
}
