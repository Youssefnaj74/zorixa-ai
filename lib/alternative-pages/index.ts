import { arcadsAlternativePage } from "@/lib/alternative-pages/arcads-alternative";
import type { AlternativeSeoPage } from "@/lib/alternative-pages/types";

export const ALTERNATIVE_SEO_PAGES: AlternativeSeoPage[] = [arcadsAlternativePage];

const PAGE_BY_SLUG = new Map(ALTERNATIVE_SEO_PAGES.map((p) => [p.slug, p]));
const PAGE_BY_PATH = new Map(ALTERNATIVE_SEO_PAGES.map((p) => [p.path, p]));

export function getAllAlternativePageSlugs(): string[] {
  return ALTERNATIVE_SEO_PAGES.map((p) => p.slug);
}

export function getAllAlternativePagePaths(): string[] {
  return ALTERNATIVE_SEO_PAGES.map((p) => p.path);
}

export function getAlternativePageBySlug(slug: string): AlternativeSeoPage | undefined {
  return PAGE_BY_SLUG.get(slug.trim().toLowerCase());
}

export function getAlternativePageByPath(path: string): AlternativeSeoPage | undefined {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return PAGE_BY_PATH.get(normalized.replace(/\/$/, "") || "/");
}
