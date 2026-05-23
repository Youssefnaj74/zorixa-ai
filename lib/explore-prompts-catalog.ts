import { MODEL_OPTIONS } from "@/components/ui/ModelDropdown";
import { isAtlasImageComposerId } from "@/lib/atlas-image-model-ids";

export type ExplorePromptEntry = {
  id: string;
  modelId: string;
  title: string;
  /** English prompt — sent to Atlas (Arabic breaks Atlas Cloud UI). */
  prompt: string;
  imageUrl: string;
  aspectRatio?: string;
};

export type ExplorePromptModelFilter = {
  id: "all" | string;
  label: string;
};

export const EXPLORE_PROMPT_MODEL_FILTERS: ExplorePromptModelFilter[] = [
  { id: "all", label: "All" },
  ...MODEL_OPTIONS.filter((m) => isAtlasImageComposerId(m.id)).map((m) => ({
    id: m.id,
    label: m.id === "zorixa" ? "Zorixa Image" : m.label
  }))
];

/** Curated starters — expand per model over time. */
export const EXPLORE_PROMPTS: ExplorePromptEntry[] = [
  {
    id: "zorixa-sahara-sunset",
    modelId: "zorixa",
    title: "Sahara sunset",
    prompt:
      "cinematic sunset over Moroccan Sahara desert, golden sand dunes, dramatic orange and crimson sky, photorealistic",
    imageUrl:
      "https://atlas-img.oss-us-west-1.aliyuncs.com/images/f6ea437b-be83-4586-b3ed-947dcf03f43a.png",
    aspectRatio: "16:9"
  },
  {
    id: "zorixa-portrait-neon",
    modelId: "zorixa",
    title: "Neon portrait",
    prompt:
      "editorial portrait of a young woman, soft neon rim light, shallow depth of field, 85mm lens, hyperreal skin texture",
    imageUrl: "/identity-1.jpg",
    aspectRatio: "3:4"
  },
  {
    id: "zorixa-product-luxury",
    modelId: "zorixa",
    title: "Luxury product",
    prompt:
      "luxury perfume bottle on black marble, studio softbox lighting, subtle reflections, premium advertising still life",
    imageUrl: "/enhanced-1.jpg",
    aspectRatio: "1:1"
  },
  {
    id: "zorixa-cinema-still",
    modelId: "zorixa",
    title: "Cinema still",
    prompt:
      "wide cinematic film still, lone traveler on desert highway at dusk, anamorphic lens flare, muted teal and orange grade",
    imageUrl: "/cinema-1.jpg",
    aspectRatio: "16:9"
  },
  {
    id: "zorixa-influencer-selfie",
    modelId: "zorixa",
    title: "Creator selfie",
    prompt:
      "authentic iPhone-style selfie, natural window light, cozy cafe background, warm tones, social media aesthetic",
    imageUrl: "/influencer-1.jpg",
    aspectRatio: "9:16"
  },
  {
    id: "zorixa-fantasy-city",
    modelId: "zorixa",
    title: "Fantasy skyline",
    prompt:
      "futuristic Moroccan medina at night, glowing lanterns, rain-slick cobblestones, cinematic atmosphere, detailed architecture",
    imageUrl:
      "https://images.unsplash.com/photo-1569387336298-93409d02d5c1?w=800&q=80",
    aspectRatio: "16:9"
  }
];

export function buildExplorePromptStudioHref(entry: ExplorePromptEntry): string {
  const params = new URLSearchParams({
    tab: "Text to Image",
    model: entry.modelId,
    prompt: entry.prompt
  });
  if (entry.aspectRatio) params.set("aspect", entry.aspectRatio);
  return `/image?${params.toString()}`;
}

export function explorePromptsForModel(modelFilter: string): ExplorePromptEntry[] {
  if (modelFilter === "all") return EXPLORE_PROMPTS;
  return EXPLORE_PROMPTS.filter((p) => p.modelId === modelFilter);
}
