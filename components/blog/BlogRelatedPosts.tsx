import Link from "next/link";

import type { BlogPost } from "@/lib/blog/types";

export function BlogRelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="mt-14 border-t border-white/10 pt-10">
      <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Related articles</h2>
      <ul className="mt-4 space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="group block rounded-xl border border-white/10 p-4 hover:border-white/20">
              <p className="font-semibold text-white group-hover:text-[#00e5ff]">{post.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-white/55">{post.description}</p>
              <p className="mt-2 text-xs text-white/40">{post.readingTimeMinutes} min read</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
