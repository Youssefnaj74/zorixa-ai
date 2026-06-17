import type { MetadataRoute } from "next";

import { getAllModelSeoSlugs } from "@/lib/model-seo-catalog";
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
    "/billing",
    "/abuse",
    "/faq",
    "/pricing",
    "/tools",
    "/models",
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

  return [...paths, ...modelPaths].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path.startsWith("/models/") ? "weekly" : ("monthly" as const),
    priority: path === ""
      ? 1
      : path.startsWith("/models/")
        ? 0.85
        : path === "/about" || path === "/faq" || path === "/models"
          ? 0.9
          : 0.7
  }));
}
