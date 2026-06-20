import type { AlternativeSeoPage } from "@/lib/alternative-pages/types";
import { absoluteUrl, SITE_NAME } from "@/lib/site-brand";

export function AlternativePageJsonLd({ page }: { page: AlternativeSeoPage }) {
  const url = absoluteUrl(page.path);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    datePublished: page.publishedAt,
    dateModified: page.publishedAt,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/zorixa-icon.png") }
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    keywords: page.keywords.join(", ")
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: `${page.competitorName} Alternative`, item: url }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([article, faqPage, breadcrumb]) }}
    />
  );
}
