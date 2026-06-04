import Link from "next/link";

import { ContactEmailCard, ContactForm } from "@/app/contact/contact-form";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { SUPPORT_TICKET_TYPES } from "@/data/support-issue-types";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Support",
  description: "Contact Zorixa AI support — account, generation, and platform help."
};

export default function SupportPage() {
  return (
    <MarketingDocLayout
      eyebrow="Support"
      title="Support"
      subtitle="Send us a message at support@zorixaai.com — we reply within 24–48 hours."
    >
      <ContactEmailCard email={BRAND_EMAILS.support} showEmailLink={false} />

      <section id="support-form">
        <h2 className="text-base font-bold text-white">Send a support request</h2>
        <p className="mt-2 text-sm text-white/50">
          Include your account email, what went wrong, and the model or feature you used.
        </p>
        <div className="mt-6">
          <ContactForm
            issueTypes={SUPPORT_TICKET_TYPES}
            topicLabel="Issue type"
            subjectPlaceholder="Brief summary of your issue"
            messagePlaceholder="Describe what happened — error messages, steps to reproduce…"
            sendLabel="Send support request"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          Questions about credits, failed generations, or how video models work? See the{" "}
          <Link href="/helpsupport" className="text-[#00e5ff] hover:underline">
            Help center
          </Link>
          .
        </p>
      </section>
    </MarketingDocLayout>
  );
}
