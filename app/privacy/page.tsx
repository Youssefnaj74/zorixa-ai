import { BRAND_EMAILS } from "@/lib/site-brand";

export const metadata = {
  title: "Privacy Policy · Zorixa AI",
  description: "Privacy Policy for Zorixa AI platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white font-body">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff] mb-4">Legal</p>
        <h1 className="text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/40 mb-12">Last updated: May 8, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-white/70">
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="space-y-2">
              {[
                "Account information: name, email address, and password",
                "Payment information: processed securely by Lemon Squeezy — we do not store card details",
                "Usage data: generations created, credits used, features accessed",
                "Content: images and videos you upload for processing",
                "Technical data: IP address, browser type, device information",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#00e5ff] mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="space-y-2">
              {[
                "To provide, maintain, and improve the Service",
                "To process payments and manage your credits",
                "To send important service updates and notifications",
                "To detect and prevent fraud or abuse",
                "To comply with legal obligations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#00e5ff] mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase infrastructure. Uploaded images and generated outputs are
              stored in secure cloud storage. We retain your data for as long as your account is active or as needed to
              provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="space-y-2 mt-3">
              {[
                "Supabase — database and authentication",
                "Lemon Squeezy — payment processing",
                "Stripe — underlying payment infrastructure via Lemon Squeezy",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#00e5ff] mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and authentication state. We do not use tracking or
              advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time. To exercise these rights,
              contact us at{" "}
              <a
                href={`mailto:${BRAND_EMAILS.privacy}`}
                className="text-[#00e5ff] hover:opacity-70 transition-opacity"
              >
                {BRAND_EMAILS.privacy}
              </a>{" "}
              or delete your account from settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">7. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission
              over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">8. Children's Privacy</h2>
            <p>
              Zorixa AI is not intended for users under the age of 18. We do not knowingly collect personal information
              from minors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or a
              notice on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">10. Contact</h2>
            <p>
              For privacy-related questions, contact us at{" "}
              <a
                href={`mailto:${BRAND_EMAILS.privacy}`}
                className="text-[#00e5ff] hover:opacity-70 transition-opacity"
              >
                {BRAND_EMAILS.privacy}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

