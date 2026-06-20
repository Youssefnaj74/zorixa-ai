import type { BlogSection } from "@/lib/blog/types";

export type AlternativeComparisonRow = {
  feature: string;
  arcads: string;
  zorixa: string;
};

export type AlternativeFaqItem = {
  question: string;
  answer: string;
};

export type AlternativeSeoPage = {
  slug: string;
  /** Public path without trailing slash, e.g. /arcads-alternative */
  path: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  competitorName: string;
  eyebrow: string;
  sections: BlogSection[];
  comparisonTable: AlternativeComparisonRow[];
  faq: AlternativeFaqItem[];
  ctaTitle: string;
  ctaBody: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
};
