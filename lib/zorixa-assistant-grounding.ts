/**
 * Static (no Supabase) grounding builder for ZorixaAI Assistant + eval suite.
 */

import { PUBLIC_FAQ_ITEMS } from "@/data/public-faq";
import {
  CREDIT_PACKS,
  PRICING_CATALOG_SECTIONS,
  PRICING_CREDIT_VARIANCE_NOTE
} from "@/lib/atlas-pricing-catalog";
import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import { buildMcpModelsCatalog } from "@/lib/mcp-models-catalog";
import { ZORIXA_ASSISTANT_PRODUCT_DOCUMENTATION } from "@/lib/zorixa-assistant-knowledge";
import type {
  ZorixaAssistantClientContext,
  ZorixaAssistantGrounding,
  ZorixaAssistantLiveGenerationPricing,
  ZorixaAssistantUserSnapshot
} from "@/lib/zorixa-assistant-types";

export type {
  ZorixaAssistantClientContext,
  ZorixaAssistantGrounding,
  ZorixaAssistantUserSnapshot
} from "@/lib/zorixa-assistant-types";

function cleanOptionalString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function cleanOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim().replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 0) return Math.round(n);
  }
  return null;
}

function cleanOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

export function buildLiveGenerationPricing(
  raw: ZorixaAssistantClientContext | null | undefined
): ZorixaAssistantLiveGenerationPricing {
  const uiEstimatedCredits = cleanOptionalNumber(raw?.uiEstimatedCredits);
  const backendCreditsRequired = cleanOptionalNumber(raw?.backendCreditsRequired);
  const backendCreditsBalance = cleanOptionalNumber(raw?.backendCreditsBalance);
  const pricingMismatch =
    uiEstimatedCredits !== null &&
    backendCreditsRequired !== null &&
    uiEstimatedCredits !== backendCreditsRequired;

  return {
    uiEstimatedCredits,
    backendCreditsRequired,
    backendCreditsBalance,
    pricingMismatch,
    lastGenerateError: cleanOptionalString(raw?.lastGenerateError, 500)
  };
}

export function normalizeClientContext(
  raw: ZorixaAssistantClientContext | null | undefined
): ZorixaAssistantGrounding["client"] {
  const selectedModel = cleanOptionalString(raw?.selectedModel, 80);
  return {
    page: cleanOptionalString(raw?.page, 80),
    selectedModel,
    selectedModelLabel: selectedModel
      ? composerModelDisplayLabel(selectedModel, "video")
      : null,
    selectedDuration: cleanOptionalString(raw?.selectedDuration, 40),
    selectedQuality: cleanOptionalString(raw?.selectedQuality, 40),
    selectedAspectRatio: cleanOptionalString(raw?.selectedAspectRatio, 20),
    draftPrompt: cleanOptionalString(raw?.draftPrompt, 4000),
    actionTab: cleanOptionalString(raw?.actionTab, 80),
    speedTier: cleanOptionalString(raw?.speedTier, 40),
    soundtrackOn: cleanOptionalBoolean(raw?.soundtrackOn)
  };
}

/** Catalog + FAQ + docs grounding without touching Supabase. */
export function buildStaticAssistantGrounding(input: {
  user?: ZorixaAssistantUserSnapshot | null;
  client?: ZorixaAssistantClientContext | null;
}): ZorixaAssistantGrounding {
  const models = buildMcpModelsCatalog().map((m) => ({
    id: m.id,
    label: m.label,
    kind: m.kind
  }));

  const pricingModels = PRICING_CATALOG_SECTIONS.flatMap((section) =>
    section.models.map((m) => ({
      id: m.id,
      name: m.name,
      kind: section.id,
      creditsCharged: m.creditsCharged,
      unit: m.unit
    }))
  );

  return {
    user: input.user ?? null,
    models,
    pricing: {
      packs: CREDIT_PACKS.map((p) => ({
        id: p.id,
        name: p.name,
        monthlyUsd: p.monthly,
        yearlyUsd: p.yearly,
        credits: p.credits,
        tagline: p.tagline
      })),
      models: pricingModels,
      varianceNote: PRICING_CREDIT_VARIANCE_NOTE
    },
    faq: PUBLIC_FAQ_ITEMS.map((item) => ({ q: item.q, a: item.a })),
    documentation: ZORIXA_ASSISTANT_PRODUCT_DOCUMENTATION,
    client: normalizeClientContext(input.client),
    liveGeneration: buildLiveGenerationPricing(input.client)
  };
}
