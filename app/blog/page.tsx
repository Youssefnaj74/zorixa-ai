import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/layout/Navbar";
import { getAllBlogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Blog — AI Video & Image Guides",
  description:
    "Guides, comparisons, and tutorials for AI video generation on Zorixa AI — Seedance, Kling, Hailuo, text-to-video, UGC, and more.",
  alternates: { canonical: absoluteUrl("/blog") }
};

const NAV_H = 56;

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">Blog</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Guides & comparisons</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">
            Practical SEO-friendly tutorials for AI video on Zorixa — linked to our model pages and studio.
          </p>

          <ul className="mt-12 space-y-6">
            {posts.map((post) => (
              <li key={post.slug}>
                <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/45"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                    <Link href={`/blog/${post.slug}`} className="hover:text-[#00e5ff]">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{post.description}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/40">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingTimeMinutes} min read</span>
                    <span>·</span>
                    <Link href={`/blog/${post.slug}`} className="font-semibold text-[#00e5ff] hover:underline">
                      Read article →
                    </Link>
                  </p>
                </article>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-sm text-white/40">
            <Link href="/models" className="text-[#00e5ff] hover:underline">
              Model catalog
            </Link>
            {" · "}
            <Link href="/video" className="text-[#00e5ff] hover:underline">
              Video studio
            </Link>
            {" · "}
            <Link href="/tools" className="text-[#00e5ff] hover:underline">
              All tools
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
