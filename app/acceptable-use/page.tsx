import Link from "next/link";

import { BrandEmailLink } from "@/components/marketing/BrandEmailLink";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Acceptable Use Policy · Zorixa AI",
  description:
    "Acceptable Use Policy for Zorixa AI — prohibited content, moderation, and enforcement."
};

const PROHIBITED = [
  "Pornography, nudity, or sexually explicit content",
  "Child sexual abuse material (CSAM) or any sexual content involving minors",
  "Non-consensual intimate imagery, deepfakes, or impersonation of real people without consent",
  "Illegal activity, violence, terrorism, trafficking, or instructions to cause harm",
  "Harassment, hate, or content intended to defraud or deceive",
  "Attempts to bypass moderation, safety filters, or platform limits"
] as const;

export default function AcceptableUsePage() {
  return (
    <MarketingDocLayout
      eyebrow="Trust & safety"
      title="Acceptable Use Policy"
      subtitle="Zorixa AI is a creative platform for lawful image, video, and speech generation. This policy explains what is prohibited and how we enforce it."
    >
      <section>
        <h2 className="text-base font-bold text-white">1. Scope</h2>
        <p className="mt-2">
          This policy applies to all use of Zorixa AI, including the web app, dashboard, studios, and
          API access. It supplements our{" "}
          <Link href="/terms" className="text-[#00e5ff] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">2. Prohibited content</h2>
        <p className="mt-2">You may not use Zorixa AI to create, request, or distribute:</p>
        <ul className="mt-3 space-y-2">
          {PROHIBITED.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#00e5ff]">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">3. Enforcement</h2>
        <p className="mt-2">
          Generation requests are screened server-side before they reach our AI providers. Prompts that
          violate this policy are blocked with:{" "}
          <span className="text-white/90">
            &quot;This request violates ZorixaAI Content Policy.&quot;
          </span>{" "}
          Blocked attempts are logged for safety review. We may suspend or terminate accounts that
          repeatedly violate this policy.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">4. Reporting</h2>
        <p className="mt-2">
          To report abuse or illegal content, email{" "}
          <BrandEmailLink email={BRAND_EMAILS.abuse} className="hover:opacity-70" /> or use our{" "}
          <Link href="/abuse" className="text-[#00e5ff] hover:underline">
            abuse report form
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>Last updated: June 11, 2026</p>
        <p className="mt-2">
          Related:{" "}
          <Link href="/privacy" className="text-[#00e5ff] hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/refund" className="text-[#00e5ff] hover:underline">
            Refund Policy
          </Link>
        </p>
      </section>
    </MarketingDocLayout>
  );
}
