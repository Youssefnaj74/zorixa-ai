import type { ToolCatalogItem } from "@/lib/tools-catalog";

const KEYWORD_MODEL_ALTS: Record<string, string> = {
  "kling-3-pro": "Kling 3.0 Pro AI Video model logo in ZorixaAI Video Studio",
  "kling-2-6-motion": "Kling 3.0 Pro AI Video motion model logo in ZorixaAI Video Studio",
  "seedance-2": "Seedance 2.0 Cinematic AI model logo in ZorixaAI Video Studio",
  "seedance-1-5": "Seedance 2.0 Cinematic AI model logo in ZorixaAI Video Studio",
  "seedance-1-5-pro": "Seedance 2.0 Cinematic AI model logo in ZorixaAI Video Studio",
  "flux-dev": "Flux Pro AI Images model logo in ZorixaAI Video Studio",
  "flux-schnell": "Flux Pro AI Images model logo in ZorixaAI Video Studio",
  "flux-dev-lora": "Flux Pro AI Images model logo in ZorixaAI Video Studio",
  "flux-kontext-dev": "Flux Pro AI Images model logo in ZorixaAI Video Studio",
  "flux-kontext-dev-lora": "Flux Pro AI Images model logo in ZorixaAI Video Studio"
};

function normalizeComposerId(composerId: string): string {
  return composerId.trim().toLowerCase();
}

/** Alt text for model brand logos shown across the app. */
export function modelLogoAlt(composerId: string, label?: string): string {
  const id = normalizeComposerId(composerId);
  const keywordAlt = KEYWORD_MODEL_ALTS[id];
  if (keywordAlt) return keywordAlt;
  if (label?.trim()) {
    return `${label.trim()} model logo in ZorixaAI Video Studio`;
  }
  return `${composerId.replace(/-/g, " ")} model logo in ZorixaAI Video Studio`;
}

/** Alt text for tool catalog preview thumbnails. */
export function toolCatalogPreviewAlt(item: ToolCatalogItem): string {
  const id = normalizeComposerId(item.composerModelId);
  if (id.includes("kling")) {
    return `Kling 3.0 Pro AI Video preview — ${item.title} in ZorixaAI Video Studio`;
  }
  if (id.includes("seedance")) {
    return `Seedance 2.0 Cinematic AI preview — ${item.title} in ZorixaAI Video Studio`;
  }
  if (id.includes("flux")) {
    return `Flux Pro AI Images preview — ${item.title} in ZorixaAI Video Studio`;
  }
  if (item.sectionId === "image-to-video" || item.sectionId === "text-to-video") {
    if (/ugc|ads|creator|influencer/i.test(`${item.title} ${item.subtitle ?? ""}`)) {
      return `UGC Ads Creator preview — ${item.title} in ZorixaAI Video Studio`;
    }
    return `AI cinematic video generation preview — ${item.title} in ZorixaAI Video Studio`;
  }
  if (item.sectionId === "character-swap") {
    return `Professional AI character swap preview — ${item.title} in ZorixaAI Video Studio`;
  }
  return `${item.title} workflow preview in ZorixaAI Video Studio`;
}

export function zorixaLogoAlt(): string {
  return "ZorixaAI Video Studio logo";
}

export function studioReferenceImageAlt(kind: "video" | "image" | "enhance" = "video"): string {
  if (kind === "image") {
    return "Reference image uploaded for Flux Pro AI Images generation in ZorixaAI Video Studio";
  }
  if (kind === "enhance") {
    return "Source image selected for AI enhancement in ZorixaAI Video Studio";
  }
  return "Reference frame uploaded for AI cinematic video generation in ZorixaAI Video Studio";
}

export function userAvatarAlt(): string {
  return "User profile photo in ZorixaAI Video Studio";
}

export function dashboardFeatureAlt(title: string, badge?: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes("ugc")) {
    return `UGC Ads Creator — ${title} workflow in ZorixaAI Video Studio`;
  }
  if (normalized.includes("cinema") || badge === "CINEMA") {
    return `Seedance 2.0 Cinematic AI — ${title} in ZorixaAI Video Studio`;
  }
  if (normalized.includes("flux") || normalized.includes("image")) {
    return `Flux Pro AI Images — ${title} in ZorixaAI Video Studio`;
  }
  if (normalized.includes("kling")) {
    return `Kling 3.0 Pro AI Video — ${title} in ZorixaAI Video Studio`;
  }
  return `${title} feature preview in ZorixaAI Video Studio`;
}

export function viralToolCardAlt(title: string, headline?: string): string {
  const label = headline?.trim() || title;
  if (/ugc|ads|creator/i.test(label)) {
    return `UGC Ads Creator — ${title} in ZorixaAI Video Studio`;
  }
  if (/cinema|seedance|film/i.test(label)) {
    return `Seedance 2.0 Cinematic AI — ${title} in ZorixaAI Video Studio`;
  }
  if (/kling/i.test(label)) {
    return `Kling 3.0 Pro AI Video — ${title} in ZorixaAI Video Studio`;
  }
  return `${title} tool preview in ZorixaAI Video Studio`;
}

export function historyPreviewAlt(label: string): string {
  return `${label} generation preview in ZorixaAI Video Studio`;
}

export function generationThumbnailAlt(featureType: "image" | "video"): string {
  if (featureType === "video") {
    return "AI cinematic video generation result in ZorixaAI Video Studio";
  }
  return "Flux Pro AI Images generation result in ZorixaAI Video Studio";
}

export function explorePromptPreviewAlt(title: string): string {
  return `AI generation example — ${title} in ZorixaAI Video Studio`;
}

export function modelSeoHeroAlt(modelName: string): string {
  const normalized = modelName.toLowerCase();
  if (normalized.includes("kling")) {
    return `Kling 3.0 Pro AI Video — ${modelName} in ZorixaAI Video Studio`;
  }
  if (normalized.includes("seedance")) {
    return `Seedance 2.0 Cinematic AI — ${modelName} in ZorixaAI Video Studio`;
  }
  if (normalized.includes("flux")) {
    return `Flux Pro AI Images — ${modelName} in ZorixaAI Video Studio`;
  }
  return `${modelName} AI model preview in ZorixaAI Video Studio`;
}

export function reviewHeroAlt(modelName: string): string {
  return modelSeoHeroAlt(modelName);
}

export function loginHeroAlt(): string {
  return "ZorixaAI Video Studio — AI image and video generation platform";
}

export function supportScreenshotAlt(): string {
  return "Support inquiry screenshot attached in ZorixaAI Video Studio";
}

export function beforeAfterAlt(kind: "before" | "after"): string {
  if (kind === "before") {
    return "Before AI enhancement in ZorixaAI Video Studio";
  }
  return "After AI enhancement result in ZorixaAI Video Studio";
}

export function studioFrameAlt(kind: "source" | "start" | "result"): string {
  if (kind === "result") {
    return "AI generation result in ZorixaAI Video Studio";
  }
  if (kind === "start") {
    return "Start frame uploaded for AI cinematic video generation in ZorixaAI Video Studio";
  }
  return "Source image uploaded for Flux Pro AI Images generation in ZorixaAI Video Studio";
}

export function previewHtmlAlt(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("kling")) {
    return `Kling 3.0 Pro AI Video — ${label} model preview`;
  }
  if (normalized.includes("seedance")) {
    return `Seedance 2.0 Cinematic AI — ${label} model preview`;
  }
  if (normalized.includes("flux")) {
    return `Flux Pro AI Images — ${label} model preview`;
  }
  return `${label} model preview in ZorixaAI Video Studio`;
}
