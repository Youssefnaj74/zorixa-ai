import type { MetadataRoute } from "next";

import { getAllAlternativePagePaths } from "@/lib/alternative-pages";
import { getAllVersusPagePaths } from "@/lib/comparison-pages";
import { getAllBlogSlugs } from "@/lib/blog";
import { getAllModelSeoSlugs } from "@/lib/model-seo-catalog";
import { getAllModelReviewSlugs } from "@/lib/review-pages-catalog";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import { EXPLORE_PROMPTS_PUBLIC } from "@/lib/site-features";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();
  const now = new Date();

  const paths = [
    "",
    "/about",
    "/about/founder",
    "/contact",
    "/affiliate",
    "/billing",
    "/abuse",
    "/faq",
    "/pricing",
    "/tools",
    "/models",
    "/blog",
    "/reviews",
    "/image",
    "/video",
    "/audio",
    ...(EXPLORE_PROMPTS_PUBLIC ? ["/explore-prompts"] : []),
    "/support",
    "/helpsupport",
    "/terms",
    "/privacy",
    "/refund",
    "/login",
    "/signup"
  ];

  const modelPaths = getAllModelSeoSlugs().map((slug) => `/models/${slug}`);
  const blogPaths = getAllBlogSlugs().map((slug) => `/blog/${slug}`);
  const reviewPaths = getAllModelReviewSlugs().map((slug) => `/reviews/${slug}`);
  const alternativePaths = getAllAlternativePagePaths();
  const versusPaths = getAllVersusPagePaths();

  return [...paths, ...modelPaths, ...blogPaths, ...reviewPaths, ...alternativePaths, ...versusPaths].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency:
      path === "" ||
      path.startsWith("/models/") ||
      path.startsWith("/blog/") ||
      path.startsWith("/reviews/") ||
      path.endsWith("-alternative") ||
      path.endsWith("-vs-zorixaai")
        ? "weekly"
        : ("monthly" as const),
    priority: path === ""
      ? 1
      : path.startsWith("/models/") ||
          path.startsWith("/blog/") ||
          path.startsWith("/reviews/") ||
          path.endsWith("-alternative") ||
          path.endsWith("-vs-zorixaai")
        ? 0.85
        : path === "/about" || path === "/faq" || path === "/models" || path === "/blog" || path === "/reviews"
          ? 0.9
          : 0.7
  }));
}
