import Link from "next/link";

import { AffiliateApplyForm } from "@/components/marketing/AffiliateApplyForm";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import {
  AFFILIATE_COMMISSION_LABEL,
  getAffiliateFormUrl,
  getAffiliateTallyEmbedUrl
} from "@/lib/affiliate-config";
import { absoluteUrl } from "@/lib/site-brand";

export const metadata = {
  title: "Affiliate Program",
  description:
    "Earn recurring commission promoting Zorixa AI — AI image, video, and speech studio for creators. Apply for launch partner access."
};

const STEPS = [
  "Apply with your site, newsletter, or social channels.",
  "Get approved and receive your unique referral link.",
  "Share Zorixa AI with your audience (reviews, tutorials, comparisons).",
  "Earn commission when referred users subscribe to a credit pack."
] as const;

const IDEAL_PARTNERS = [
  "AI tool reviewers and YouTube creators",
  "Product Hunt makers and newsletter writers",
  "UGC / ad creative educators",
  "Agencies comparing HeyGen, Runway, or Arcads alternatives"
] as const;

export default function AffiliatePage() {
  const tallyEmbedUrl = getAffiliateTallyEmbedUrl();
  const formUrl = getAffiliateFormUrl();

  return (
    <MarketingDocLayout
      eyebrow="Partners"
      title="Zorixa AI Affiliate Program"
      subtitle="Launch partners earn recurring commission when their audience subscribes — no paid ads required on your side. Perfect for creators covering AI video and image tools."
    >
      <section className="rounded-2xl border border-[#00e5ff]/20 bg-[#00e5ff]/[0.04] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">Launch offer</p>
        <p className="mt-2 text-lg font-semibold text-white">{AFFILIATE_COMMISSION_LABEL}</p>
        <p className="mt-2 text-sm text-white/55">
          on referred credit pack subscriptions. Payouts via PayPal or Wise once you reach the minimum threshold.
          Launch partners may receive bonus credits instead of cash — ask us when you apply.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Why promote Zorixa AI?</h2>
        <ul className="mt-4 space-y-2">
          {[
            "One studio for top image & video models (Kling, Veo, Seedance, Flux, and more)",
            "Transparent credit pricing — easy to explain in reviews and tutorials",
            "Strong fit for Product Hunt, alternative pages, and tool comparison content",
            "You only earn when we earn — performance-based growth"
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#00e5ff]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Who should apply</h2>
        <ul className="mt-4 space-y-2">
          {IDEAL_PARTNERS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#00e5ff]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">How it works</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-[#00e5ff]">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Apply now</h2>
        <p className="mt-2 text-sm text-white/50">
          Product Hunt launch partners welcome — mention your PH username or channel in the form.
        </p>
        <div className="mt-6" id="apply">
          <AffiliateApplyForm tallyEmbedUrl={tallyEmbedUrl} formUrl={formUrl} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p className="font-semibold text-white/70">Quick links for your content</p>
        <ul className="mt-3 space-y-1">
          <li>
            <Link href="/pricing" className="text-[#00e5ff] hover:underline">
              Pricing & credit packs
            </Link>
          </li>
          <li>
            <Link href="/heygen-alternative" className="text-[#00e5ff] hover:underline">
              HeyGen alternative
            </Link>
          </li>
          <li>
            <Link href="/runway-alternative" className="text-[#00e5ff] hover:underline">
              Runway alternative
            </Link>
          </li>
          <li>
            <span className="text-white/40">Homepage: </span>
            <span className="text-white/60">{absoluteUrl("/")}</span>
          </li>
        </ul>
      </section>
    </MarketingDocLayout>
  );
}
