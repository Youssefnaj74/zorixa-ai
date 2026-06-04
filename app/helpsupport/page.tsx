import Link from "next/link";

import { SupportInquiryForm } from "@/app/support/support-inquiry-form";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Help center",
  description:
    "Zorixa AI help center — credits, image and video generation, FAQs, and troubleshooting."
};

export default function HelpSupportPage() {
  return (
    <MarketingDocLayout
      eyebrow="Help"
      title="Help center"
      subtitle="Credits, generation tips, and common fixes. Still stuck? Open a support ticket with a screenshot."
    >
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-sm text-white/55">
        <p>
          To email us directly, use{" "}
          <Link href="/support" className="font-medium text-[#00e5ff] hover:underline">
            {BRAND_EMAILS.support}
          </Link>{" "}
          or the form below.
        </p>
      </section>

      <SupportInquiryForm />

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          Billing or refunds?{" "}
          <Link href="/billing" className="text-[#00e5ff] hover:underline">
            Billing
          </Link>
          {" · "}
          Partnerships?{" "}
          <Link href="/contact" className="text-[#00e5ff] hover:underline">
            Contact
          </Link>
        </p>
      </section>
    </MarketingDocLayout>
  );
}
