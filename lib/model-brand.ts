/** Provider / brand family for composer model logos. */
export type ModelBrandId =
  | "openai"
  | "google"
  | "grok"
  | "qwen"
  | "seedance"
  | "flux"
  | "wan"
  | "kling"
  | "hailuo"
  | "vidu"
  | "alibaba"
  | "infinitetalk"
  | "veed"
  | "zorixa";

export function resolveModelBrand(composerId: string): ModelBrandId {
  const id = composerId.toLowerCase().trim();
  if (!id) return "zorixa";

  if (id.includes("gpt-image") || id.includes("openai")) return "openai";
  if (
    id.includes("nano-banana") ||
    id.includes("gemini") ||
    id.includes("google-veo") ||
    id.includes("veo-3")
  ) {
    return "google";
  }
  if (id.includes("grok")) return "grok";
  if (id === "zorixa" || id.includes("qwen")) return "qwen";
  if (id.includes("seedream") || id.includes("seedance")) return "seedance";
  if (id.includes("flux")) return "flux";
  if (id.includes("wan")) return "wan";
  if (id.includes("kling")) return "kling";
  if (id.includes("hailuo")) return "hailuo";
  if (id.includes("vidu")) return "vidu";
  if (id.includes("happyhorse")) return "alibaba";
  if (id.includes("infinitetalk")) return "infinitetalk";
  if (id.includes("veed") || id.includes("fabric")) return "veed";
  if (id.includes("upscaler")) return "zorixa";

  return "zorixa";
}
