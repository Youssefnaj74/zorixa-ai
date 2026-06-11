import Link from "next/link";

import { BrandEmailLink } from "@/components/marketing/BrandEmailLink";
import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Terms of Service · Zorixa AI",
  description: "Terms of Service for Zorixa AI platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white font-body">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff] mb-4">Legal</p>
        <h1 className="text-4xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-white/40 mb-12">Last updated: May 8, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-white/70">
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Zorixa AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              Zorixa AI provides AI-powered image enhancement, UGC video generation, and related creative tools. The
              Service is provided on an &quot;as is&quot; basis and may be updated or modified at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. User Accounts</h2>
            <p>
              You must create an account to access certain features. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities that occur under your account. You must
              provide accurate and complete information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. Credits and Payments</h2>
            <p>
              Zorixa AI operates on a credit-based system. Credits are purchased through our payment processor (Dodo
              Payments) and are non-refundable unless required by applicable law. Credits do not expire and have no cash
              value. Subscription plans renew automatically unless cancelled before the renewal date. See our{" "}
              <Link href="/refund" className="text-[#00e5ff] hover:text-white hover:underline">
                Refund Policy
              </Link>{" "}
              for details. Billing questions and refund requests:{" "}
              <BrandEmailLink email={BRAND_EMAILS.billing} className="hover:opacity-70" />
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to use Zorixa AI to:</p>
            <ul className="space-y-2 list-none">
              {[
                "Generate content that is illegal, harmful, threatening, or abusive",
                "Infringe upon the intellectual property rights of others",
                "Create deepfakes or non-consensual intimate imagery",
                "Attempt to reverse engineer or compromise the platform",
                "Resell or redistribute the Service without written permission",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#00e5ff] mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              See our{" "}
              <Link href="/acceptable-use" className="text-[#00e5ff] hover:text-white hover:underline">
                Acceptable Use Policy
              </Link>{" "}
              for prohibited content and enforcement details. To report abuse or illegal content, email{" "}
              <BrandEmailLink email={BRAND_EMAILS.abuse} className="hover:opacity-70" />
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">6. Intellectual Property</h2>
            <p>
              You retain ownership of the content you create using Zorixa AI. By using the Service, you grant Zorixa AI a
              limited license to process your content solely for the purpose of providing the Service. Zorixa AI retains
              all rights to its underlying models, software, and platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind, either express or implied. Zorixa AI does
              not warrant that the Service will be uninterrupted, error-free, or free of harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Zorixa AI shall not be liable for any indirect, incidental, special,
              or consequential damages arising from your use of the Service, even if advised of the possibility of such
              damages.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms. You may
              also delete your account at any time from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">11. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <BrandEmailLink email={BRAND_EMAILS.support} className="hover:opacity-70" />
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

