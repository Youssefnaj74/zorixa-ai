import explorePromptsData from "@/data/explore-prompts.json";
import { MODEL_OPTIONS } from "@/components/ui/ModelDropdown";
import { gptImage2SelectionForAspect } from "@/components/image/image-bottom-bar-constants";

/** All Explore prompt cards and studio deep links use portrait 3:4 (GPT Image 2 → 1024×1536). */
export const EXPLORE_PROMPT_DEFAULT_ASPECT = "3:4" as const;

/** Tailwind aspect class for grid preview tiles. */
export const EXPLORE_PROMPT_UI_ASPECT_CLASS = "aspect-[3/4]" as const;

/**
 * Explore sidebar models — curated subset (not every studio model).
 * Flux/Wan: Dev + Schnell + Wan 2.7 Pro only; LoRA, Kontext, Wan 2.7/2.6 hidden.
 */
const EXPLORE_PROMPT_MODEL_ALLOWLIST = new Set([
  "gpt-image-2",
  "nano-banana-2",
  "nano-banana-pro",
  "zorixa",
  "seedream-5",
  "grok-imagine",
  "flux-dev",
  "flux-schnell",
  "wan-image-2-7-pro"
]);

export type ExplorePromptEntry = {
  id: string;
  modelId: string;
  title: string;
  /** English prompt — sent to Atlas (Arabic breaks Atlas Cloud UI). */
  prompt: string;
  /**
   * Preview under `public/explore-prompts/<id>.webp` (or .jpg / .png).
   * Leave unset until you add the file — cards show a placeholder.
   */
  imageUrl?: string | null;
  /** Defaults to {@link EXPLORE_PROMPT_DEFAULT_ASPECT}. */
  aspectRatio?: string;
  /** Hero card on Explore prompts (first match wins when several are flagged). */
  featured?: boolean;
};

/** Where to put preview files: `public/explore-prompts/{id}.webp` (or .jpg / .png). */
export function explorePromptPublicImagePath(
  id: string,
  ext: "webp" | "jpg" | "png" = "png"
): string {
  return `/explore-prompts/${id}.${ext}`;
}

/** Local preview paths to try when `imageUrl` is unset (webp first, then common Atlas exports). */
export function explorePromptPreviewCandidates(entry: ExplorePromptEntry): string[] {
  const custom = entry.imageUrl?.trim();
  if (custom) return [custom];
  const exts: Array<"png" | "jpg" | "webp"> = ["png", "jpg", "webp"];
  return exts.map((ext) => explorePromptPublicImagePath(entry.id, ext));
}

export type ExplorePromptModelFilter = {
  id: "all" | string;
  label: string;
};

export const EXPLORE_PROMPT_MODEL_FILTERS: ExplorePromptModelFilter[] = [
  { id: "all", label: "All" },
  ...MODEL_OPTIONS.filter((m) => EXPLORE_PROMPT_MODEL_ALLOWLIST.has(m.id)).map((m) => ({
    id: m.id,
    label: m.id === "zorixa" ? "Qwen 2.0 Pro" : m.label
  }))
];

/**
 * Prompt cards — edit `data/explore-prompts.json` (or run `npm run import:explore-prompts`).
 * Preview: `public/explore-prompts/<id>.png` · default aspect {@link EXPLORE_PROMPT_DEFAULT_ASPECT}.
 */
export const EXPLORE_PROMPTS: ExplorePromptEntry[] = explorePromptsData as ExplorePromptEntry[];

export function explorePromptModelLabel(modelId: string): string {
  return EXPLORE_PROMPT_MODEL_FILTERS.find((f) => f.id === modelId)?.label ?? modelId;
}

export function buildExplorePromptStudioHref(entry: ExplorePromptEntry): string {
  const aspect = entry.aspectRatio?.trim() || EXPLORE_PROMPT_DEFAULT_ASPECT;
  const params = new URLSearchParams({
    tab: "Text to Image",
    model: entry.modelId,
    prompt: entry.prompt
  });
  if (entry.modelId === "gpt-image-2") {
    const gpt = gptImage2SelectionForAspect(aspect);
    params.set("resolution", gpt.resolution);
    params.set("aspect", gpt.aspect);
  } else {
    params.set("aspect", aspect);
  }
  return `/image?${params.toString()}`;
}

export function explorePromptsForModel(modelFilter: string): ExplorePromptEntry[] {
  if (modelFilter === "all") return EXPLORE_PROMPTS;
  return EXPLORE_PROMPTS.filter((p) => p.modelId === modelFilter);
}
