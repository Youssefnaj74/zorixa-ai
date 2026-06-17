import type { ToolCatalogSectionId } from "@/lib/tools-catalog";

export type ReviewCompareRow = { model: string; bestFor: string };

export type ModelReviewPage = {
  slug: string;
  composerModelId: string;
  modelPageSlug: string;
  name: string;
  provider: string;
  /** Meta title pattern: "{name} Review (2026)" */
  title: string;
  description: string;
  verdict: string;
  pros: string[];
  cons: string[];
  pricingNotes: string[];
  comparisonRows: ReviewCompareRow[];
  comparisonSummary: string;
  studioSectionId: ToolCatalogSectionId;
  keywords: string[];
  relatedReviewSlugs: string[];
  relatedBlogSlugs: string[];
};

export const MODEL_REVIEW_PAGES: ModelReviewPage[] = [
  {
    slug: "seedance-2-review",
    composerModelId: "seedance-2",
    modelPageSlug: "seedance-2",
    name: "Seedance 2.0",
    provider: "ByteDance",
    title: "Seedance 2.0 Review (2026): Is It Worth It on Zorixa AI?",
    description:
      "Honest Seedance 2.0 review — pros, cons, pricing, reference video quality, and who should use it on Zorixa AI vs Kling or Runway.",
    verdict:
      "Seedance 2.0 is one of the best picks on Zorixa AI if you need reference-driven video (images + clips + audio), cinematic motion, or anime-style shots up to 15 seconds. It is weaker if you only need simple UGC talking-head clips — Hailuo is faster for that.",
    pros: [
      "Strong multimodal Reference to Video with @image / @video / @audio tokens",
      "Cinematic and anime workflows via AI Director",
      "Up to 15s with 720p–1080p tiers plus Fast speed option",
      "One of the most versatile video models in the Zorixa studio"
    ],
    cons: [
      "Real-person reference images may be rejected by upstream policy",
      "Not the cheapest model per run vs Hailuo for short UGC",
      "Multi-shot ad planning is better on Kling 3 Pro",
      "Longer generations than lightweight social models"
    ],
    pricingNotes: [
      "Billed in Zorixa credits — typical 5s 720p run shown in the studio before you generate",
      "Fast tier costs fewer credits than Standard for iteration",
      "No separate ByteDance account required on Zorixa"
    ],
    comparisonRows: [
      { model: "Kling 3 Pro", bestFor: "Multi-shot 1080p ads" },
      { model: "Hailuo 2.3", bestFor: "UGC / social hooks" },
      { model: "Vidu Q3", bestFor: "Product reference video" }
    ],
    comparisonSummary:
      "Pick Seedance when reference media and cinematic motion matter. Pick Kling for structured multi-shot ads. Pick Hailuo for creator-style UGC.",
    studioSectionId: "text-to-video",
    keywords: ["Seedance 2 review", "Seedance 2.0 review", "ByteDance Seedance", "AI video review"],
    relatedReviewSlugs: ["kling-3-pro-review", "vidu-q3-review"],
    relatedBlogSlugs: ["seedance-2-vs-kling-3-pro", "text-to-video-guide"]
  },
  {
    slug: "kling-3-pro-review",
    composerModelId: "kling-3-pro",
    modelPageSlug: "kling-3-pro",
    name: "Kling 3.0 Pro",
    provider: "Kuaishou",
    title: "Kling 3 Pro Review (2026): Motion, Multi-Shot & 1080p",
    description:
      "Kling 3.0 Pro review for creators — pros, cons, credit pricing on Zorixa AI, multi-shot mode, and comparisons with Seedance and Runway-class tools.",
    verdict:
      "Kling 3 Pro is the top choice on Zorixa when you want linked camera beats, sharp 1080p output, and action-heavy ad creative. It is not the default for reference-video mashups — use Seedance 2.0 for that.",
    pros: [
      "Multi-shot mode plans cohesive scenes from one prompt",
      "Strong 1080p text and image to video",
      "Optional native audio on supported runs",
      "Excellent for trailers, hero shots, and character motion"
    ],
    cons: [
      "Higher credit cost than Hailuo or Gemini Omni Flash for drafts",
      "No Reference to Video workflow like Seedance",
      "Premium tier — overkill for quick social tests",
      "Best results need thoughtful prompt structure"
    ],
    pricingNotes: [
      "Pro-tier pricing reflected in Zorixa credits per 5s clip",
      "Multi-shot may use more compute — check the Generate label",
      "Compare side-by-side with Seedance in the same credit wallet"
    ],
    comparisonRows: [
      { model: "Seedance 2.0", bestFor: "R2V and cinematic reference" },
      { model: "Hailuo 2.3", bestFor: "UGC volume testing" },
      { model: "Vidu Q3-Pro", bestFor: "Start-end product frames" }
    ],
    comparisonSummary:
      "Kling 3 Pro wins on multi-shot pro ads. Seedance wins on multimodal reference. Hailuo wins on UGC speed and cost.",
    studioSectionId: "text-to-video",
    keywords: ["Kling 3 Pro review", "Kling 3.0 review", "Kling AI video review"],
    relatedReviewSlugs: ["seedance-2-review", "hailuo-2-3-review"],
    relatedBlogSlugs: ["seedance-2-vs-kling-3-pro", "best-ai-video-generator-2026"]
  },
  {
    slug: "hailuo-2-3-review",
    composerModelId: "hailuo-2-3",
    modelPageSlug: "hailuo-2-3",
    name: "Hailuo 2.3",
    provider: "MiniMax",
    title: "Hailuo 2.3 Review (2026): Best for AI UGC?",
    description:
      "Hailuo 2.3 review — UGC-style AI video pros and cons, pricing on Zorixa AI, and when to choose Hailuo over Seedance or Kling.",
    verdict:
      "Hailuo 2.3 is the social-first workhorse on Zorixa AI. If you make TikTok ads, creator-style testimonials, or fast hook tests, start here. For cinematic B-roll or reference mashups, upgrade to Seedance or Vidu.",
    pros: [
      "Tuned for UGC and influencer-style motion",
      "AI Director routes UGC prompts to Hailuo automatically",
      "Solid image-to-video from portraits and product stills",
      "Lower credits than Kling Pro for short clips"
    ],
    cons: [
      "Less cinematic than Seedance on wide establishing shots",
      "No reference-video token workflow",
      "Not ideal for multi-shot epic ads",
      "Std vs Pro tiers affect quality — pick intentionally"
    ],
    pricingNotes: [
      "T2V Pro and I2V Standard pricing differ — see studio tooltip",
      "Great for high-volume A/B hook testing on a budget",
      "Credits shown before each generation on Zorixa"
    ],
    comparisonRows: [
      { model: "Seedance 2.0", bestFor: "Cinematic + R2V" },
      { model: "Kling 3 Pro", bestFor: "Multi-shot 1080p" },
      { model: "Vidu Q3", bestFor: "Product reference" }
    ],
    comparisonSummary:
      "Hailuo is the default for UGC. Move to Seedance or Kling when the brief outgrows social-native motion.",
    studioSectionId: "text-to-video",
    keywords: ["Hailuo 2.3 review", "Hailuo AI video review", "MiniMax Hailuo review", "UGC AI video"],
    relatedReviewSlugs: ["seedance-2-review", "kling-3-pro-review"],
    relatedBlogSlugs: ["how-to-create-ugc-videos-with-ai", "image-to-video-guide"]
  },
  {
    slug: "vidu-q3-review",
    composerModelId: "vidu-q3",
    modelPageSlug: "vidu-q3",
    name: "Vidu Q3",
    provider: "Vidu",
    title: "Vidu Q3 Review (2026): Product & Reference Video",
    description:
      "Vidu Q3 review — reference to video, product shots, pros and cons, and pricing on Zorixa AI compared with Seedance and Kling.",
    verdict:
      "Vidu Q3 shines for product marketing and reference-driven clips on Zorixa AI. AI Director sends product-style briefs here. Use Q3-Pro when you need explicit start-end frame control.",
    pros: [
      "Strong Reference to Video for brand and product assets",
      "Video to Video editing on supported workflows",
      "Q3-Pro variant for start-end transitions",
      "Good balance of quality and credits for commerce teams"
    ],
    cons: [
      "Less known than Seedance for general cinematic prompts",
      "Q3 vs Q3-Pro picker can confuse first-time users",
      "Not the top pick for anime or UGC portraits",
      "Reference limits differ by tab — read model tips in studio"
    ],
    pricingNotes: [
      "720p Q3 and 1080p Q3-Pro priced separately in credits",
      "Product teams often batch 5–8s variants for ads",
      "Try Reference to Video tab with Vidu Q3 pre-selected from Tools"
    ],
    comparisonRows: [
      { model: "Seedance 2.0", bestFor: "Multimodal R2V + audio tokens" },
      { model: "Kling 3 Pro", bestFor: "Multi-shot hero ads" },
      { model: "Hailuo 2.3", bestFor: "UGC social" }
    ],
    comparisonSummary:
      "Vidu Q3 is the commerce-friendly reference model. Seedance is broader; Kling is more cinematic-action.",
    studioSectionId: "reference-to-video",
    keywords: ["Vidu Q3 review", "Vidu AI review", "product AI video review"],
    relatedReviewSlugs: ["seedance-2-review", "hailuo-2-3-review"],
    relatedBlogSlugs: ["best-ai-video-generator-2026", "image-to-video-guide"]
  }
];

const BY_SLUG = new Map(MODEL_REVIEW_PAGES.map((p) => [p.slug, p]));

export function getModelReviewPage(slug: string): ModelReviewPage | undefined {
  return BY_SLUG.get(slug.trim().toLowerCase());
}

export function getAllModelReviewSlugs(): string[] {
  return MODEL_REVIEW_PAGES.map((p) => p.slug);
}
