import { PUBLIC_FAQ_ITEMS } from "@/data/public-faq";
import { absoluteUrl, BRAND_EMAILS, SITE_NAME, SITE_TAGLINE } from "@/lib/site-brand";

/** Honest structured data — no fake ratings or review counts. */
export function SiteJsonLd({ includeFaq = false }: { includeFaq?: boolean }) {
  const origin = absoluteUrl("/");

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: origin,
    logo: absoluteUrl("/zorixa-icon.png"),
    email: BRAND_EMAILS.contact,
    description: SITE_TAGLINE
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: origin,
    description: SITE_TAGLINE,
    publisher: { "@type": "Organization", name: SITE_NAME }
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: origin,
    description:
      "AI image and video generation studio with multiple models including Kling, Google Veo, Flux, GPT Image 2, Seedance, and Hailuo.",
    offers: {
      "@type": "Offer",
      price: "9.99",
      priceCurrency: "USD",
      description: "Starter plan — monthly, credit-based"
    },
    provider: { "@type": "Organization", name: SITE_NAME, url: origin }
  };

  const graphs = [organization, website, software];

  const faqPage = includeFaq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: PUBLIC_FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a }
        }))
      }
    : null;

  const payload = faqPage ? [...graphs, faqPage] : graphs;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
