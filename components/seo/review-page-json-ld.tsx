import type { ModelReviewPage } from "@/lib/review-pages-catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/site-brand";

export function ReviewPageJsonLd({ page }: { page: ModelReviewPage }) {
  const url = absoluteUrl(`/reviews/${page.slug}`);

  const review = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: page.title,
    reviewBody: page.verdict,
    author: { "@type": "Organization", name: SITE_NAME },
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: page.name,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web"
    },
    publisher: { "@type": "Organization", name: SITE_NAME },
    url
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Reviews", item: absoluteUrl("/reviews") },
      { "@type": "ListItem", position: 3, name: `${page.name} Review`, item: url }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([review, breadcrumb]) }}
    />
  );
}
