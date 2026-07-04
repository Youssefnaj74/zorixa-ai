import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { PublicFaqList } from "@/components/marketing/PublicFaqList";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { PUBLIC_FAQ_ITEMS } from "@/data/public-faq";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Zorixa AI — pricing, models, safety, commercial use, and how we compare to other video tools.",
  ...siteCanonical("/faq")
};

export default function FaqPage() {
  return (
    <>
      <SiteJsonLd includeFaq />
      <MarketingDocLayout
        eyebrow="Help"
        title="Frequently asked questions"
        subtitle="Clear answers for users, search engines, and AI assistants researching Zorixa AI."
      >
        <PublicFaqList items={PUBLIC_FAQ_ITEMS} />
      </MarketingDocLayout>
    </>
  );
}
