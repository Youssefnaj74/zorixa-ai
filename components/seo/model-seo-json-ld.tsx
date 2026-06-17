import type { ModelSeoPage } from "@/lib/model-seo-catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/site-brand";

export function ModelSeoJsonLd({ page }: { page: ModelSeoPage }) {
  const pageUrl = absoluteUrl(`/models/${page.slug}`);

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${page.name} on ${SITE_NAME}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: pageUrl,
    description: page.description,
    provider: { "@type": "Organization", name: page.provider },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Credit-based usage on Zorixa AI — see pricing page"
    }
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Models", item: absoluteUrl("/models") },
      { "@type": "ListItem", position: 3, name: page.name, item: pageUrl }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([software, faqPage, breadcrumb]) }}
    />
  );
}
