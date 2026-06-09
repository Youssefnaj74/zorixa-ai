import Link from "next/link";

import { BrandEmailLink } from "@/components/marketing/BrandEmailLink";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Refund Policy · Zorixa AI",
  description: "Refund and billing policy for Zorixa AI credits and subscriptions."
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white font-body">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff] mb-4">Legal</p>
        <h1 className="text-4xl font-extrabold text-white mb-2">Refund Policy</h1>
        <p className="text-sm text-white/40 mb-12">Last updated: June 3, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-white/70">
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Credit purchases</h2>
            <p>
              Zorixa AI uses a credit-based system. Credits are sold through Dodo Payments and are generally{" "}
              <strong className="text-white/90">non-refundable</strong> once delivered to your account, except where
              required by applicable law or where we confirm a billing error on our side.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. Subscriptions</h2>
            <p>
              If you have an active subscription, you can cancel before the next renewal date to avoid future charges.
              Cancellation stops future billing; it does not automatically refund the current billing period unless a
              refund is required by law or approved by our billing team.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. When we may issue a refund</h2>
            <ul className="space-y-2">
              {[
                "Duplicate charge or clear payment processing error",
                "Credits were not added to your account after a successful payment",
                "Extended platform outage that prevented use of purchased credits",
                "Other cases required by consumer protection law in your jurisdiction"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#00e5ff] mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. How to request a refund</h2>
            <p>
              Email{" "}
              <BrandEmailLink email={BRAND_EMAILS.billing} className="hover:opacity-70" /> or{" "}
              <BrandEmailLink email={BRAND_EMAILS.support} className="hover:opacity-70" /> within 14 days of the
              charge. Include your account email, order ID from Dodo Payments, and a short description of the issue. We
              typically respond within 2–3 business days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Related policies</h2>
            <p>
              See also our{" "}
              <Link href="/terms" className="text-[#00e5ff] hover:text-white hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#00e5ff] hover:text-white hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
