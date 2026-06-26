import type { BlogSection } from "@/lib/blog/types";
import type { AlternativeComparisonRow, AlternativeFaqItem } from "@/lib/alternative-pages/types";

export type VersusSeoPage = {
  slug: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  competitorName: string;
  eyebrow: string;
  quickVerdict: string[];
  comparisonTable: AlternativeComparisonRow[];
  sections: BlogSection[];
  whoCompetitor: { title: string; paragraphs: string[]; bullets?: string[] };
  whoZorixa: { title: string; paragraphs: string[]; bullets?: string[] };
  faq: AlternativeFaqItem[];
  ctaTitle: string;
  ctaBody: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
};
