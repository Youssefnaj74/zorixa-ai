import { getPublicSiteUrl } from "@/lib/public-site-url";

export const SITE_NAME = "Zorixa AI";
export const SITE_TAGLINE = "AI image & video generation for creators and teams";

/** Central email aliases (Zoho forwards → one inbox; use labels to sort). */
export const BRAND_EMAILS = {
  support: "support@zorixaai.com",
  contact: "hello@zorixaai.com",
  billing: "billing@zorixaai.com",
  privacy: "privacy@zorixaai.com",
  abuse: "abuse@zorixaai.com"
} as const;

export type BrandEmailKey = keyof typeof BRAND_EMAILS;

/** @deprecated Use BRAND_EMAILS.support — kept for existing imports */
export const SUPPORT_EMAIL = BRAND_EMAILS.support;
export const CONTACT_EMAIL = BRAND_EMAILS.contact;
export const BILLING_EMAIL = BRAND_EMAILS.billing;
export const PRIVACY_EMAIL = BRAND_EMAILS.privacy;
export const ABUSE_EMAIL = BRAND_EMAILS.abuse;

export const BRAND_CONFIG = {
  name: SITE_NAME,
  tagline: SITE_TAGLINE,
  emails: BRAND_EMAILS,
  url: () => siteOrigin()
} as const;

/** Optional — set in Vercel for founder page (no fake placeholders in production). */
export const FOUNDER_NAME = process.env.NEXT_PUBLIC_FOUNDER_NAME?.trim() || "";
export const FOUNDER_LINKEDIN_URL = process.env.NEXT_PUBLIC_FOUNDER_LINKEDIN_URL?.trim() || "";

export function siteOrigin(): string {
  return getPublicSiteUrl();
}

export function absoluteUrl(path: string): string {
  const base = siteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Opens Gmail compose in the browser (works when mailto: has no local mail app). */
export function gmailComposeUrl(to: string, subject?: string): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", to });
  if (subject?.trim()) params.set("su", subject.trim());
  return `https://mail.google.com/mail/?${params.toString()}`;
}
