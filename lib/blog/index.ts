import { bestAiVideoGenerator2026Post } from "@/lib/blog/posts/best-ai-video-generator-2026";
import { imageToVideoGuidePost } from "@/lib/blog/posts/image-to-video-guide";
import { seedanceVsKlingPost } from "@/lib/blog/posts/seedance-2-vs-kling-3-pro";
import { textToVideoGuidePost } from "@/lib/blog/posts/text-to-video-guide";
import { ugcVideosWithAiPost } from "@/lib/blog/posts/how-to-create-ugc-videos-with-ai";
import type { BlogAuthor, BlogPost } from "@/lib/blog/types";
import { FOUNDER_NAME, SITE_NAME } from "@/lib/site-brand";

export const BLOG_POSTS: BlogPost[] = [
  seedanceVsKlingPost,
  bestAiVideoGenerator2026Post,
  ugcVideosWithAiPost,
  textToVideoGuidePost,
  imageToVideoGuidePost
];

const POST_BY_SLUG = new Map(BLOG_POSTS.map((p) => [p.slug, p]));

export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return POST_BY_SLUG.get(slug.trim().toLowerCase());
}

export function getRelatedBlogPosts(post: BlogPost, limit = 3): BlogPost[] {
  const explicit = (post.relatedPostSlugs ?? [])
    .map((s) => getBlogPost(s))
    .filter((p): p is BlogPost => Boolean(p));

  if (explicit.length >= limit) return explicit.slice(0, limit);

  const tagSet = new Set(post.tags);
  const byTag = getAllBlogPosts().filter(
    (p) => p.slug !== post.slug && p.tags.some((t) => tagSet.has(t))
  );

  const merged = [...explicit];
  for (const p of byTag) {
    if (merged.some((m) => m.slug === p.slug)) continue;
    merged.push(p);
    if (merged.length >= limit) break;
  }
  return merged.slice(0, limit);
}

export function getDefaultBlogAuthor(): BlogAuthor {
  return {
    name: FOUNDER_NAME || SITE_NAME,
    role: FOUNDER_NAME ? "Founder" : "Team",
    bio: FOUNDER_NAME
      ? `${FOUNDER_NAME} builds ${SITE_NAME} — one studio for premium AI image and video models with transparent credits.`
      : `${SITE_NAME} helps creators generate images and videos with Seedance, Kling, Hailuo, Vidu, and more in one dashboard.`
  };
}

/** Parse [[label|href]] inline links in blog copy. */
export function splitBlogInlineLinks(text: string): Array<{ type: "text" | "link"; value: string; href?: string }> {
  const parts: Array<{ type: "text" | "link"; value: string; href?: string }> = [];
  const re = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({ type: "link", value: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}
