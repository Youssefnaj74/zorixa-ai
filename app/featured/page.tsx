import type { Metadata } from "next";
import Link from "next/link";

import { LaunchBuffBadge } from "@/components/marketing/LaunchBuffBadge";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { absoluteUrl } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Featured On",
  description:
    "Directories and communities where Zorixa AI has been featured — AI image and video generation for creators and teams.",
  alternates: { canonical: absoluteUrl("/featured") },
  openGraph: {
    title: "Featured On · Zorixa AI",
    description:
      "Directories and communities where Zorixa AI has been featured — AI image and video generation for creators and teams.",
    url: absoluteUrl("/featured")
  }
};

export default function FeaturedPage() {
  return (
    <MarketingDocLayout
      eyebrow="Recognition"
      title="Featured on"
      subtitle="Zorixa AI has been highlighted by launch directories and creator communities. Explore where we have been featured."
    >
      <section aria-labelledby="featured-badges-heading">
        <h2 id="featured-badges-heading" className="text-base font-bold text-white">
          Badges
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Click a badge to visit the listing or directory.
        </p>
        <ul className="mt-8 flex flex-wrap items-center gap-8 sm:gap-10">
          <li>
            <LaunchBuffBadge />
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          <span className="font-semibold text-white/70">Press or directory listing?</span> If you feature Zorixa
          AI and would like us to link back, reach out via{" "}
          <Link href="/contact" className="text-[#00e5ff] hover:underline">
            Contact
          </Link>
          .
        </p>
      </section>
    </MarketingDocLayout>
  );
}
