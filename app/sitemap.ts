import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/public-site-url";

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
    "/explore-prompts",
    "/support",
    "/helpsupport",
    "/terms",
    "/privacy",
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
