import { GEMINI_OMNI_FLASH_T2V_COMPOSER_ID } from "@/lib/atlas-gemini-omni-video";
import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";
import type { ToolCatalogSectionId } from "@/lib/tools-catalog";

export type ModelSeoCapability =
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "video-to-video"
  | "character-swap"
  | "text-to-image"
  | "image-to-image";

export type ModelSeoFaq = { q: string; a: string };

export type ModelSeoCompareRow = { label: string; zorixa: string; note?: string };

export type ModelSeoPage = {
  slug: string;
  composerModelId: string;
  name: string;
  provider: string;
  tagline: string;
  /** Meta description (~155 chars). */
  description: string;
  heroSubtitle: string;
  category: "video" | "image";
  capabilities: ModelSeoCapability[];
  features: string[];
  faq: ModelSeoFaq[];
  compareRows?: ModelSeoCompareRow[];
  studioSectionId: ToolCatalogSectionId;
  keywords: string[];
};

export const MODEL_CAPABILITY_LABELS: Record<ModelSeoCapability, string> = {
  "text-to-video": "Text to Video",
  "image-to-video": "Image to Video",
  "reference-to-video": "Reference to Video",
  "video-to-video": "Video to Video",
  "character-swap": "Character Swap",
  "text-to-image": "Text to Image",
  "image-to-image": "Image to Image"
};

export const MODEL_SEO_PAGES: ModelSeoPage[] = [
  {
    slug: "seedance-2",
    composerModelId: "seedance-2",
    name: "Seedance 2.0",
    provider: "ByteDance",
    tagline: "Multimodal cinematic video generation",
    description:
      "Generate cinematic AI videos with Seedance 2.0 on Zorixa AI. Text-to-video, image-to-video, and reference-to-video with up to 15s clips and 720p–1080p output.",
    heroSubtitle:
      "ByteDance’s flagship multimodal video model — strong motion, reference clips, and creator-friendly controls in one studio.",
    category: "video",
    capabilities: ["text-to-video", "image-to-video", "reference-to-video"],
    features: [
      "Text, image, and reference video inputs in one workflow",
      "Up to 15 seconds per generation with 720p and 1080p tiers",
      "Reference to Video with @image / @video / @audio tokens",
      "Standard and Fast speed tiers for cost vs. latency trade-offs",
      "Built into AI Director for cinematic and anime styles"
    ],
    compareRows: [
      { label: "Max duration", zorixa: "Up to 15s", note: "Resolution-dependent" },
      { label: "Reference media", zorixa: "Images, video, audio" },
      { label: "Best for", zorixa: "Cinematic shots, anime, R2V ads" }
    ],
    faq: [
      {
        q: "What is Seedance 2.0?",
        a: "Seedance 2.0 is ByteDance’s multimodal video generation model. On Zorixa AI you can animate from text, a start frame, or reference media."
      },
      {
        q: "Does Seedance 2.0 support image to video?",
        a: "Yes. Upload a start frame in Image to Video mode, set duration and resolution, and describe the motion you want."
      },
      {
        q: "What is Reference to Video on Seedance 2.0?",
        a: "Reference to Video lets you combine reference images, clips, and audio in one prompt using @image1, @video1, and @audio1 tokens."
      }
    ],
    studioSectionId: "text-to-video",
    keywords: ["Seedance 2.0", "AI video generator", "text to video", "reference to video", "ByteDance video AI"]
  },
  {
    slug: "seedance-2-fast",
    composerModelId: "seedance-2",
    name: "Seedance 2.0 Fast",
    provider: "ByteDance",
    tagline: "Faster Seedance generations at lower cost",
    description:
      "Use Seedance 2.0 Fast on Zorixa AI for quicker, credit-efficient video generations. Same multimodal quality with a Fast speed tier.",
    heroSubtitle:
      "The Fast tier of Seedance 2.0 — ideal when you need rapid iteration on ads, social clips, and storyboards.",
    category: "video",
    capabilities: ["text-to-video", "image-to-video", "reference-to-video"],
    features: [
      "Same Seedance 2.0 model with Fast speed tier selected in the studio",
      "Lower credits per run vs. Standard tier",
      "Great for A/B testing hooks and UGC-style variations",
      "Supports Text to Video, Image to Video, and Reference to Video",
      "Switch to Standard tier when you need maximum quality"
    ],
    compareRows: [
      { label: "Speed tier", zorixa: "Fast (Standard also available)" },
      { label: "Use case", zorixa: "Rapid drafts and volume testing" },
      { label: "Model", zorixa: "Seedance 2.0" }
    ],
    faq: [
      {
        q: "What is the difference between Seedance 2.0 and Seedance 2.0 Fast?",
        a: "Both use the same Seedance 2.0 model. Fast is a speed tier in the studio that completes sooner and costs fewer credits; Standard prioritizes quality."
      },
      {
        q: "How do I select Fast tier?",
        a: "Open the video studio, choose Seedance 2.0, and pick Fast in the speed / duration tier control before generating."
      }
    ],
    studioSectionId: "text-to-video",
    keywords: ["Seedance 2.0 Fast", "fast AI video", "cheap AI video generator", "Seedance Fast tier"]
  },
  {
    slug: "kling-3-pro",
    composerModelId: "kling-3-pro",
    name: "Kling 3.0 Pro",
    provider: "Kuaishou",
    tagline: "Pro-grade text and image to video",
    description:
      "Create high-quality AI videos with Kling 3.0 Pro on Zorixa AI. Multi-shot planning, strong motion, and 1080p output for professional creatives.",
    heroSubtitle:
      "Kling’s latest Pro tier — multi-shot prompts, native audio options, and sharp 1080p results for ads and short-form content.",
    category: "video",
    capabilities: ["text-to-video", "image-to-video"],
    features: [
      "Multi-shot mode plans linked camera beats from one prompt",
      "Text to Video and Image to Video workflows",
      "Up to 1080p output on supported durations",
      "Optional native audio generation where supported",
      "AI Director routes cinematic requests to Kling when appropriate"
    ],
    compareRows: [
      { label: "Multi-shot", zorixa: "Yes (T2V / I2V)" },
      { label: "Resolution", zorixa: "Up to 1080p" },
      { label: "Best for", zorixa: "Ads, trailers, character motion" }
    ],
    faq: [
      {
        q: "What is Kling 3.0 Pro?",
        a: "Kling 3.0 Pro is Kuaishou’s premium video generation model available on Zorixa AI for text and image driven clips."
      },
      {
        q: "Does Kling 3.0 Pro support multi-shot video?",
        a: "Yes. Enable multi-shot in the studio to let Kling plan cohesive linked shots from your prompt."
      }
    ],
    studioSectionId: "text-to-video",
    keywords: ["Kling 3.0 Pro", "Kling AI video", "multi-shot AI video", "1080p AI video"]
  },
  {
    slug: "hailuo-2-3",
    composerModelId: "hailuo-2-3",
    name: "Hailuo 2.3",
    provider: "MiniMax",
    tagline: "UGC-friendly AI video generation",
    description:
      "Generate UGC-style AI videos with Hailuo 2.3 on Zorixa AI. Strong for talking-head and social content with text and image inputs.",
    heroSubtitle:
      "MiniMax Hailuo tuned for creator and UGC workflows — fast iterations for TikTok, Reels, and product demos.",
    category: "video",
    capabilities: ["text-to-video", "image-to-video"],
    features: [
      "Text to Video and Image to Video modes",
      "Popular choice for UGC and influencer-style clips",
      "Standard and Pro tiers for quality vs. cost",
      "Integrated in AI Director UGC style routing",
      "Credit-based pricing with transparent per-run costs"
    ],
    compareRows: [
      { label: "UGC workflows", zorixa: "AI Director → Hailuo" },
      { label: "Inputs", zorixa: "Text + start frame" },
      { label: "Best for", zorixa: "Social ads, creators, testimonials" }
    ],
    faq: [
      {
        q: "What is Hailuo 2.3 best for?",
        a: "Hailuo 2.3 excels at UGC-style and social-first video — short clips with natural motion from text or a portrait frame."
      },
      {
        q: "Can I use Hailuo for image to video?",
        a: "Yes. Upload a start image in Image to Video mode and describe how the subject should move or speak."
      }
    ],
    studioSectionId: "text-to-video",
    keywords: ["Hailuo 2.3", "UGC AI video", "MiniMax video", "AI influencer video"]
  },
  {
    slug: "vidu-q3",
    composerModelId: "vidu-q3",
    name: "Vidu Q3",
    provider: "Vidu",
    tagline: "Product and reference-driven video",
    description:
      "Create product and reference-based AI videos with Vidu Q3 on Zorixa AI. Reference to Video, start-end frames, and sharp motion for commerce.",
    heroSubtitle:
      "Vidu Q3 shines when you need reference clips, product shots, and controlled camera motion for marketing.",
    category: "video",
    capabilities: ["text-to-video", "image-to-video", "reference-to-video", "video-to-video"],
    features: [
      "Reference to Video with multiple image inputs",
      "Vidu Q3-Pro variant for start-end frame control",
      "Video to Video editing on supported workflows",
      "AI Director routes product-style prompts to Vidu",
      "720p and 1080p tiers depending on model variant"
    ],
    compareRows: [
      { label: "Reference video", zorixa: "Yes (Q3 R2V)" },
      { label: "Start / end frames", zorixa: "Q3-Pro" },
      { label: "Best for", zorixa: "Product videos, brand assets" }
    ],
    faq: [
      {
        q: "What is Vidu Q3?",
        a: "Vidu Q3 is a video generation model family on Zorixa AI, strong for reference-driven and product-focused clips."
      },
      {
        q: "What is the difference between Vidu Q3 and Vidu Q3-Pro?",
        a: "Q3 covers text, image, and reference workflows. Q3-Pro adds start-end frame control for precise transitions."
      }
    ],
    studioSectionId: "reference-to-video",
    keywords: ["Vidu Q3", "product AI video", "reference to video", "Vidu AI generator"]
  },
  {
    slug: "gemini-omni",
    composerModelId: GEMINI_OMNI_FLASH_T2V_COMPOSER_ID,
    name: "Gemini Omni Flash",
    provider: "Google",
    tagline: "Fast multimodal video from Google",
    description:
      "Generate AI videos with Gemini Omni Flash on Zorixa AI. Google’s developer video model for text, image, and reference-driven clips.",
    heroSubtitle:
      "Gemini Omni Flash on ModelArk — quick iterations across Text to Video, Image to Video, and Reference to Video.",
    category: "video",
    capabilities: ["text-to-video", "image-to-video", "reference-to-video"],
    features: [
      "Dedicated composer entries for T2V, I2V, and R2V tabs",
      "Multiple reference images on Reference to Video",
      "Flexible aspect ratios and duration options",
      "Good for rapid prototyping alongside Seedance and Kling",
      "Runs through Zorixa’s unified credit wallet"
    ],
    compareRows: [
      { label: "Provider", zorixa: "Google / Gemini" },
      { label: "Modalities", zorixa: "Text, image, reference" },
      { label: "Best for", zorixa: "Fast drafts, multimodal tests" }
    ],
    faq: [
      {
        q: "What is Gemini Omni Flash?",
        a: "Gemini Omni Flash is Google’s video generation model available on Zorixa AI across text, image, and reference workflows."
      },
      {
        q: "Which studio tab should I use for Gemini Omni Flash?",
        a: "Use Text to Video for prompts only, Image to Video with a start frame, or Reference to Video with reference media."
      }
    ],
    studioSectionId: "text-to-video",
    keywords: ["Gemini Omni Flash", "Google AI video", "Gemini video generator", "multimodal video AI"]
  }
];

const PAGE_BY_SLUG = new Map(MODEL_SEO_PAGES.map((p) => [p.slug, p]));

export function getModelSeoPage(slug: string): ModelSeoPage | undefined {
  return PAGE_BY_SLUG.get(slug.trim().toLowerCase());
}

export function getAllModelSeoSlugs(): string[] {
  return MODEL_SEO_PAGES.map((p) => p.slug);
}

export function modelSeoStudioHref(page: ModelSeoPage): string {
  return buildCatalogStudioHref(page.studioSectionId, page.composerModelId, {
    toolName: page.name
  });
}
