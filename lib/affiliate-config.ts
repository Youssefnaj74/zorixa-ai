import { BRAND_EMAILS } from "@/lib/site-brand";

/** Launch partner commission — update when formal program terms are published. */
export const AFFILIATE_COMMISSION_LABEL = "20% recurring commission";

export const AFFILIATE_APPLY_EMAIL = BRAND_EMAILS.contact;

function trimEnv(key: string): string | null {
  const v = process.env[key]?.trim();
  return v || null;
}

/** Full Tally embed URL, e.g. https://tally.so/embed/abc123?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1 */
export function getAffiliateTallyEmbedUrl(): string | null {
  const direct = trimEnv("NEXT_PUBLIC_AFFILIATE_TALLY_EMBED_URL");
  if (direct) return direct;

  const formUrl = trimEnv("NEXT_PUBLIC_AFFILIATE_FORM_URL");
  if (!formUrl || !formUrl.includes("tally.so")) return null;

  try {
    const url = new URL(formUrl);
    if (url.pathname.startsWith("/r/")) {
      url.pathname = url.pathname.replace(/^\/r\//, "/embed/");
    }
    if (!url.pathname.startsWith("/embed/")) return null;
    url.searchParams.set("alignLeft", "1");
    url.searchParams.set("hideTitle", "1");
    url.searchParams.set("transparentBackground", "1");
    url.searchParams.set("dynamicHeight", "1");
    return url.toString();
  } catch {
    return null;
  }
}

/** External apply link (Google Forms, Tally share page, Typeform, etc.) */
export function getAffiliateFormUrl(): string | null {
  return trimEnv("NEXT_PUBLIC_AFFILIATE_FORM_URL");
}

export function affiliateApplyMailto(): string {
  const subject = encodeURIComponent("Zorixa AI affiliate program application");
  const body = encodeURIComponent(
    "Hi Zorixa team,\n\nI would like to join the affiliate program.\n\nName:\nWebsite / social:\nAudience niche:\nEstimated monthly reach:\n\nThanks!"
  );
  return `mailto:${AFFILIATE_APPLY_EMAIL}?subject=${subject}&body=${body}`;
}
