import Link from "next/link";

import { ContactEmailCard, ContactForm } from "@/app/contact/contact-form";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Report abuse",
  description:
    "Report illegal content, Terms violations, or abuse on Zorixa AI."
};

export default function AbusePage() {
  return (
    <MarketingDocLayout
      eyebrow="Trust & safety"
      title="Report abuse"
      subtitle="Report content or behavior that violates our Terms or applicable law. Include links and context when possible."
    >
      <ContactEmailCard email={BRAND_EMAILS.abuse} />

      <section id="abuse-form">
        <h2 className="text-base font-bold text-white">Submit a report</h2>
        <p className="mt-2 text-sm text-white/50">
          We review abuse reports promptly. For urgent illegal content, include URLs and your contact email.
        </p>
        <div className="mt-6">
          <ContactForm
            fixedIssueType="Abuse Report"
            subjectPlaceholder="Abuse report — brief summary"
            messagePlaceholder="Describe the violation, URLs, and any evidence…"
            sendLabel="Send abuse report"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          General support (bugs, billing, account)? See{" "}
          <Link href="/helpsupport" className="text-[#00e5ff] hover:underline">
            Support
          </Link>{" "}
          or{" "}
          <Link href="/billing" className="text-[#00e5ff] hover:underline">
            Billing
          </Link>
          .
        </p>
      </section>
    </MarketingDocLayout>
  );
}
