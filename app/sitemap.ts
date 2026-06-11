import type { MetadataRoute } from "next";

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

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : ("monthly" as const),
    priority: path === "" ? 1 : path === "/about" || path === "/faq" ? 0.9 : 0.7
  }));
}
