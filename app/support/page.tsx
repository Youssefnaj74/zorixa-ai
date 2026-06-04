import Link from "next/link";

import { ContactEmailCard } from "@/app/contact/contact-form";
import { SupportInquiryForm } from "@/app/support/support-inquiry-form";
import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Support",
  description:
    "Zorixa AI support — technical issues, generations, credits, and account help."
};

export default function SupportPage() {
  return (
    <MarketingDocLayout
      eyebrow="Support"
      title="Help & support"
      subtitle="Account, generation, or platform issues? Send a request below — we reply within 24–48 hours."
    >
      <ContactEmailCard email={BRAND_EMAILS.support} />

      <SupportInquiryForm />

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-white/50">
        <p>
          Payment or refund questions? Use{" "}
          <Link href="/billing" className="text-[#00e5ff] hover:underline">
            Billing
          </Link>
          .
        </p>
      </section>
    </MarketingDocLayout>
  );
}
