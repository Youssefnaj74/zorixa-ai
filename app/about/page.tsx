import Link from "next/link";

import { MarketingDocLayout } from "@/components/marketing/MarketingDocLayout";
import { absoluteUrl } from "@/lib/site-brand";

export const metadata = {
  title: "About",
  description:
    "Learn what Zorixa AI is, which AI models it offers, and how it helps creators generate images and videos in one studio."
};

export default function AboutPage() {
  return (
    <MarketingDocLayout
      eyebrow="Company"
      title="About Zorixa AI"
      subtitle="One studio for professional AI image and video — built for creators who need speed, clarity, and access to top models."
    >
      <section>
        <h2 className="text-base font-bold text-white">Our mission</h2>
        <p className="mt-3">
          AI image and video tools are powerful, but fragmented. Zorixa AI exists to put leading models in one
          place with honest credit pricing, a focused workflow, and exports you can use in real projects.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">What we do</h2>
        <p className="mt-3">
          Zorixa is an aggregator platform: we connect you to premium providers (via Atlas Cloud) while you work
          in a single dashboard. You choose a model, set duration and resolution where supported, and generate.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            "Text-to-image and image-to-image with GPT Image 2, Flux, Seedream, Nano Banana, Wan, and more",
            "Text-to-video, image-to-video, and reference-to-video with Kling, Veo, Seedance, Hailuo, Grok, Gemini, and others",
            "Character swap, video edit, and audio-to-video workflows",
            "Credit-based plans with transparent per-generation costs",
            "History, downloads, and account management"
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-[#00e5ff] mt-0.5">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Who we serve</h2>
        <p className="mt-3">
          Marketers, UGC creators, indie filmmakers, and teams who need fast iteration without managing a dozen
          separate API accounts. Whether you are testing ad creatives or producing cinematic clips, Zorixa is
          built to keep you in flow.
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Payments & trust</h2>
        <p className="mt-3">
          Subscriptions and credit packs are sold through Dodo Payments. We do not store card numbers on our
          servers. For legal terms, see our{" "}
          <Link href="/terms" className="text-[#00e5ff] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#00e5ff] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Status</h2>
        <p className="mt-3">
          Zorixa AI is publicly available and actively developed. New models and studio improvements ship
          regularly. We are early-stage and welcome feedback via{" "}
          <Link href="/helpsupport" className="text-[#00e5ff] hover:underline">
            Support
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-bold text-white">Learn more</h2>
        <p className="mt-3">
          <Link href="/about/founder" className="text-[#00e5ff] hover:underline">
            Meet the founder
          </Link>
          {" · "}
          <Link href="/tools" className="text-[#00e5ff] hover:underline">
            Browse tools
          </Link>
          {" · "}
          <a href={absoluteUrl("/llms.txt")} className="text-[#00e5ff] hover:underline">
            llms.txt
          </a>
        </p>
      </section>
    </MarketingDocLayout>
  );
}
