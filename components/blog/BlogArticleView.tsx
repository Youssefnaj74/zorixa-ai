import Link from "next/link";

import { BlogAuthorBox } from "@/components/blog/BlogAuthorBox";
import { BlogModelLinks } from "@/components/blog/BlogModelLinks";
import { BlogRelatedPosts } from "@/components/blog/BlogRelatedPosts";
import { BlogSectionContent } from "@/components/blog/BlogSectionContent";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { Navbar } from "@/components/layout/Navbar";
import { BlogArticleJsonLd } from "@/components/seo/blog-article-json-ld";
import { getDefaultBlogAuthor, getRelatedBlogPosts } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog/types";

const NAV_H = 56;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function BlogArticleView({ post }: { post: BlogPost }) {
  const author = getDefaultBlogAuthor();
  const related = getRelatedBlogPosts(post);

  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <BlogArticleJsonLd post={post} authorName={author.name} />
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <nav className="text-xs text-white/45" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70">
              Home
            </Link>
            {" / "}
            <Link href="/blog" className="hover:text-white/70">
              Blog
            </Link>
            {" / "}
            <span className="text-white/70 line-clamp-1">{post.title}</span>
          </nav>

          <header className="mt-8 max-w-3xl">
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">{post.description}</p>
            <p className="mt-4 text-sm text-white/40">
              {formatDate(post.publishedAt)} · {post.readingTimeMinutes} min read
            </p>
          </header>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
            <article className="min-w-0 max-w-3xl">
              {post.sections.map((section) => (
                <BlogSectionContent key={section.id} section={section} />
              ))}

              <BlogModelLinks slugs={post.relatedModelSlugs} />
              <BlogRelatedPosts posts={related} />
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <BlogTableOfContents sections={post.sections} />
                <BlogAuthorBox author={author} />
              </div>
            </aside>
          </div>

          <div className="mt-10 lg:hidden">
            <BlogTableOfContents sections={post.sections} />
            <div className="mt-6">
              <BlogAuthorBox author={author} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
