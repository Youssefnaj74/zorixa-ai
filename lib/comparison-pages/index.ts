import { klingVsZorixaPage } from "@/lib/comparison-pages/kling-vs-zorixaai";
import type { VersusSeoPage } from "@/lib/comparison-pages/types";

export const VERSUS_SEO_PAGES: VersusSeoPage[] = [klingVsZorixaPage];

const PAGE_BY_SLUG = new Map(VERSUS_SEO_PAGES.map((p) => [p.slug, p]));
const PAGE_BY_PATH = new Map(VERSUS_SEO_PAGES.map((p) => [p.path, p]));

export function getAllVersusPageSlugs(): string[] {
  return VERSUS_SEO_PAGES.map((p) => p.slug);
}

export function getAllVersusPagePaths(): string[] {
  return VERSUS_SEO_PAGES.map((p) => p.path);
}

export function getVersusPageBySlug(slug: string): VersusSeoPage | undefined {
  return PAGE_BY_SLUG.get(slug.trim().toLowerCase());
}

export function getVersusPageByPath(path: string): VersusSeoPage | undefined {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return PAGE_BY_PATH.get(normalized.replace(/\/$/, "") || "/");
}
