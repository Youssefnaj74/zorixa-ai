/** Shared ZorixaAI Assistant grounding types (safe to import in unit tests). */

export type ZorixaAssistantClientContext = {
  page?: string | null;
  selectedModel?: string | null;
  selectedDuration?: string | null;
  selectedQuality?: string | null;
  selectedAspectRatio?: string | null;
  draftPrompt?: string | null;
  actionTab?: string | null;
  speedTier?: string | null;
  soundtrackOn?: boolean | null;
  uiEstimatedCredits?: number | null;
  backendCreditsRequired?: number | null;
  backendCreditsBalance?: number | null;
  lastGenerateError?: string | null;
};

export type ZorixaAssistantUserSnapshot = {
  credits: number;
  plan: string;
  isPremium: boolean;
};

export type ZorixaAssistantLiveGenerationPricing = {
  uiEstimatedCredits: number | null;
  backendCreditsRequired: number | null;
  backendCreditsBalance: number | null;
  pricingMismatch: boolean;
  lastGenerateError: string | null;
};

export type ZorixaAssistantGrounding = {
  user: ZorixaAssistantUserSnapshot | null;
  models: Array<{ id: string; label: string; kind: "image" | "video" }>;
  pricing: {
    packs: Array<{
      id: string;
      name: string;
      monthlyUsd: number;
      yearlyUsd: number;
      credits: number;
      tagline: string;
    }>;
    models: Array<{
      id: string;
      name: string;
      kind: string;
      creditsCharged: number;
      unit: string;
    }>;
    varianceNote: string;
  };
  faq: Array<{ q: string; a: string }>;
  documentation: string;
  client: {
    page: string | null;
    selectedModel: string | null;
    selectedModelLabel: string | null;
    selectedDuration: string | null;
    selectedQuality: string | null;
    selectedAspectRatio: string | null;
    draftPrompt: string | null;
    actionTab: string | null;
    speedTier: string | null;
    soundtrackOn: boolean | null;
  };
  /** Authoritative live Generate pricing from the current studio page + last API error. */
  liveGeneration: ZorixaAssistantLiveGenerationPricing;
};
