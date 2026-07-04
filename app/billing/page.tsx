import Link from "next/link";

import { ContactEmailCard, ContactForm } from "@/app/contact/contact-form";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { BRAND_EMAILS } from "@/lib/site-brand";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Billing",
  description:
    "Billing and payments help for Zorixa AI — refunds, Dodo Payments charges, credits, and invoices.",
  ...siteCanonical("/billing")
};

export default function BillingPage() {
  return (
    <MarketingDocLayout
      eyebrow="Billing"
      title="Billing & payments"
      subtitle="Questions about charges, credits, subscriptions, or refunds? Send us the details below."
    >
      <ContactEmailCard email={BRAND_EMAILS.billing} />

      <section id="billing-form">
        <h2 className="text-base font-bold text-white">Send a billing request</h2>
        <p className="mt-2 text-sm text-white/50">
          Include your account email, order ID from Dodo Payments if you have one, and what you need help with.
        </p>
        <div className="mt-6">
          <ContactForm
            fixedIssueType="Billing & Payments"
            subjectPlaceholder="Billing issue or refund request"
            messagePlaceholder="Describe the charge, date, and what you expected…"
            sendLabel="Send billing request"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          Technical issues (generations, login, models)? See the{" "}
          <Link href="/helpsupport" className="text-[#00e5ff] hover:underline">
            Help center
          </Link>
          .
        </p>
      </section>
    </MarketingDocLayout>
  );
}
