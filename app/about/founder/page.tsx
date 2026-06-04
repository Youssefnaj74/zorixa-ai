import Link from "next/link";

import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { FOUNDER_LINKEDIN_URL, FOUNDER_NAME, SUPPORT_EMAIL } from "@/lib/site-brand";

export const metadata = {
  title: "Founder",
  description: "Why Zorixa AI was built and who is behind the platform."
};

export default function FounderPage() {
  const founderLabel = FOUNDER_NAME || "the Zorixa founder";

  return (
    <MarketingDocLayout
      eyebrow="Team"
      title="From the founder"
      subtitle="Zorixa started as a practical fix for a messy creator workflow — not as another generic AI wrapper."
    >
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <p className="text-base leading-relaxed text-white/75 italic">
          &ldquo;I built Zorixa AI because switching between tools, APIs, and pricing pages was slowing down
          every project. I wanted one studio where I could run GPT Image 2 for stills, Kling or Veo for video,
          and see exactly what each generation costs — without guessing.&rdquo;
        </p>
        <p className="mt-4 text-sm text-white/50">— {founderLabel}</p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Why Zorixa exists</h2>
        <p className="mt-3">
          Most teams do not need another closed ecosystem. They need reliable access to the best open models,
          clear credit math, and a UI that stays out of the way. That is the product principle behind every
          studio tab we ship.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">What we optimize for</h2>
        <ul className="mt-4 space-y-2">
          {[
            "Transparent pricing per model and duration",
            "Fast iteration for ads, social, and short-form video",
            "Honest documentation so users and search engines understand the product",
            "Responsive support when generations or billing go wrong"
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-[#00e5ff] mt-0.5">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Get in touch</h2>
        <p className="mt-3">
          Product feedback and partnerships:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00e5ff] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        {FOUNDER_LINKEDIN_URL ? (
          <p className="mt-2">
            LinkedIn:{" "}
            <a
              href={FOUNDER_LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00e5ff] hover:underline"
            >
              {FOUNDER_LINKEDIN_URL}
            </a>
          </p>
        ) : null}
      </section>

      <p>
        <Link href="/about" className="text-[#00e5ff] hover:underline">
          ← About Zorixa AI
        </Link>
      </p>
    </MarketingDocLayout>
  );
}
