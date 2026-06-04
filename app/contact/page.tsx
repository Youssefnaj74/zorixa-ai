import Link from "next/link";

import { ContactEmailCard, ContactForm } from "@/app/contact/contact-form";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Contact",
  description:
    "Contact Zorixa AI by email or send a message — partnerships, press, and general inquiries."
};

export default function ContactPage() {
  return (
    <MarketingDocLayout
      eyebrow="Company"
      title="Contact us"
      subtitle="Reach the Zorixa AI team for partnerships, press, or general questions. We read every message."
    >
      <ContactEmailCard email={BRAND_EMAILS.contact} />

      <section>
        <h2 className="text-base font-bold text-white">Send a message</h2>
        <p className="mt-2 text-sm text-white/50">
          Prefer a form? Fill in the details below and we&apos;ll get back to you by email.
        </p>
        <div className="mt-6" id="contact-form">
          <ContactForm />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          <span className="font-semibold text-white/70">Remote-first product.</span> Zorixa AI serves creators
          globally. Payments are processed through Lemon Squeezy; support is in English.
        </p>
        <p className="mt-3">
          <Link href="/faq" className="text-[#00e5ff] hover:underline">
            FAQ
          </Link>
          {" · "}
          <Link href="/about" className="text-[#00e5ff] hover:underline">
            About
          </Link>
        </p>
      </section>
    </MarketingDocLayout>
  );
}
