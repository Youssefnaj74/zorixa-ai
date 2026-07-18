import { describe, expect, it } from "vitest";

import { CREDIT_PACKS, PRICING_CATALOG_SECTIONS } from "@/lib/atlas-pricing-catalog";
import { buildMcpModelsCatalog } from "@/lib/mcp-models-catalog";
import { PUBLIC_FAQ_ITEMS } from "@/data/public-faq";
import { composerModelDisplayLabel } from "@/lib/composer-model-label";
import type { ZorixaAssistantGrounding } from "@/lib/zorixa-assistant-types";
import { buildStaticAssistantGrounding } from "@/lib/zorixa-assistant-grounding";
import { buildZorixaAssistantSystemPrompt } from "@/lib/zorixa-assistant-prompt";
import {
  ASSISTANT_INSUFFICIENT_LIVE_INFO_REPLY,
  ASSISTANT_MISSING_INFO_REPLY,
  ASSISTANT_OFF_TOPIC_REPLY,
  ASSISTANT_PRICING_MISMATCH_REPLY,
  buildGroundingFacts,
  findAssistantHallucination,
  guardAssistantReply,
  isLikelyOffTopicAssistantQuery
} from "@/lib/zorixa-assistant-replies";

function fixtureGrounding(
  overrides: Partial<ZorixaAssistantGrounding> = {}
): ZorixaAssistantGrounding {
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

  const selectedModel = "hailuo-2-3";

  return {
    user: { credits: 395, plan: "Starter", isPremium: false },
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
      varianceNote: "Credits usage varies by model."
    },
    faq: PUBLIC_FAQ_ITEMS.map((item) => ({ q: item.q, a: item.a })),
    documentation: "Zorixa AI documentation fixture.",
    client: {
      page: "Video Studio",
      selectedModel,
      selectedModelLabel: composerModelDisplayLabel(selectedModel, "video"),
      selectedDuration: "5s",
      selectedQuality: "Best",
      selectedAspectRatio: null,
      draftPrompt: null,
      actionTab: "Text to Video",
      speedTier: "Standard",
      soundtrackOn: false
    },
    liveGeneration: {
      uiEstimatedCredits: null,
      backendCreditsRequired: null,
      backendCreditsBalance: null,
      pricingMismatch: false,
      lastGenerateError: null
    },
    ...overrides
  };
}

describe("ZorixaAI Assistant system prompt", () => {
  it("requires the exact missing-info support reply (never invent)", () => {
    const prompt = buildZorixaAssistantSystemPrompt(fixtureGrounding());
    expect(prompt).toContain(ASSISTANT_MISSING_INFO_REPLY);
    expect(prompt).toContain("NEVER invent, guess, or approximate");
    expect(prompt).not.toContain('say exactly: "I don\'t have that information."');
  });

  it("requires product-expert and prompt-engineer behavior", () => {
    const prompt = buildZorixaAssistantSystemPrompt(fixtureGrounding());
    expect(prompt).toContain("ZorixaAI Product Expert");
    expect(prompt).toContain("Respect the user's chosen model");
    expect(prompt).toContain("Prompt Engineer mode");
    expect(prompt).toContain("Score /10");
    expect(prompt).toContain("Be opinionated");
    expect(prompt).toContain(ASSISTANT_INSUFFICIENT_LIVE_INFO_REPLY);
    expect(prompt).toContain("model-aware");
  });

  it("requires the exact off-topic specialized-assistant reply", () => {
    const prompt = buildZorixaAssistantSystemPrompt(fixtureGrounding());
    expect(prompt).toContain(ASSISTANT_OFF_TOPIC_REPLY);
    expect(prompt).toContain("only help with ZorixaAI");
  });

  it("grounds only real catalog models and pack prices", () => {
    const grounding = fixtureGrounding();
    const prompt = buildZorixaAssistantSystemPrompt(grounding);

    for (const model of grounding.models) {
      expect(prompt).toContain(model.label);
      expect(prompt).toContain(`id: ${model.id}`);
    }

    for (const pack of grounding.pricing.packs) {
      expect(prompt).toContain(pack.name);
      expect(prompt).toContain(`$${pack.monthlyUsd}/mo`);
      expect(prompt).toContain(`${pack.credits} credits`);
    }

    expect(prompt).toContain("Credits balance: 395");
    expect(prompt).toContain("Hailuo 2.3");
    expect(prompt).not.toMatch(/\bmidjourney\b.*\bavailable in (?:our|the) studio/i);
  });

  it("includes live generation pricing rules and mismatch guidance", () => {
    const grounding = fixtureGrounding({
      liveGeneration: {
        uiEstimatedCredits: 271,
        backendCreditsRequired: 433,
        backendCreditsBalance: 377,
        pricingMismatch: true,
        lastGenerateError: "Not enough credits (need 433, you have 377). View plans."
      }
    });
    const prompt = buildZorixaAssistantSystemPrompt(grounding);
    expect(prompt).toContain("NEVER calculate credits manually");
    expect(prompt).toContain("UI Generate button credits: 271");
    expect(prompt).toContain("Backend credits required");
    expect(prompt).toContain("433");
    expect(prompt).toContain("Pricing mismatch (UI != backend required): YES");
    expect(prompt).toContain(ASSISTANT_PRICING_MISMATCH_REPLY);
    expect(prompt).toContain("Reference catalog defaults (NOT the live Generate price)");
  });
});

describe("buildStaticAssistantGrounding live pricing", () => {
  it("flags pricing mismatch from live UI vs backend credits", () => {
    const grounding = buildStaticAssistantGrounding({
      client: {
        page: "Video Studio",
        selectedModel: "kling-3-pro",
        uiEstimatedCredits: 271,
        backendCreditsRequired: 433,
        backendCreditsBalance: 377,
        soundtrackOn: true,
        selectedDuration: "10s",
        selectedQuality: "1080p"
      }
    });
    expect(grounding.liveGeneration.pricingMismatch).toBe(true);
    expect(grounding.client.soundtrackOn).toBe(true);
    expect(grounding.liveGeneration.uiEstimatedCredits).toBe(271);
    expect(grounding.liveGeneration.backendCreditsRequired).toBe(433);
  });
});

describe("isLikelyOffTopicAssistantQuery", () => {
  it("allows ZorixaAI product questions", () => {
    expect(isLikelyOffTopicAssistantQuery("Which model is best for UGC?")).toBe(false);
    expect(isLikelyOffTopicAssistantQuery("How many credits do I have?")).toBe(false);
    expect(isLikelyOffTopicAssistantQuery("What is the Starter plan price?")).toBe(false);
    expect(isLikelyOffTopicAssistantQuery("Improve my Seedance prompt")).toBe(false);
  });

  it("flags clearly unrelated questions", () => {
    expect(isLikelyOffTopicAssistantQuery("What's the weather in Paris today?")).toBe(true);
    expect(isLikelyOffTopicAssistantQuery("Write me a Python sorting function")).toBe(true);
    expect(isLikelyOffTopicAssistantQuery("Who won the NBA finals?")).toBe(true);
  });
});

describe("guardAssistantReply — anti-hallucination", () => {
  const grounding = fixtureGrounding({
    liveGeneration: {
      uiEstimatedCredits: 271,
      backendCreditsRequired: 433,
      backendCreditsBalance: 377,
      pricingMismatch: true,
      lastGenerateError: "Not enough credits (need 433, you have 377). View plans."
    }
  });
  const facts = buildGroundingFacts({
    models: grounding.models,
    packs: grounding.pricing.packs,
    pricingModels: grounding.pricing.models,
    userCredits: grounding.user?.credits ?? null,
    uiEstimatedCredits: grounding.liveGeneration.uiEstimatedCredits,
    backendCreditsRequired: grounding.liveGeneration.backendCreditsRequired,
    backendCreditsBalance: grounding.liveGeneration.backendCreditsBalance
  });

  it("allows grounded model and pricing answers", () => {
    const reply =
      "For UGC, Hailuo 2.3 is a strong pick on ZorixaAI. Starter is $9.99/mo for 1,000 credits. You currently have 395 credits.";
    expect(findAssistantHallucination(reply, facts)).toBeNull();
    expect(guardAssistantReply(reply, facts)).toEqual({
      reply,
      guarded: false,
      reason: null,
      kind: null
    });
  });

  it("allows live UI vs backend mismatch answers", () => {
    const reply =
      "The Generate button currently shows 271 Credits, but the backend requires 433 Credits. This indicates a pricing mismatch.";
    expect(findAssistantHallucination(reply, facts)).toBeNull();
  });

  it("blocks invented credit arithmetic", () => {
    const reply = "Kling costs about 169 × 2 = 338 credits for 10 seconds.";
    const guarded = guardAssistantReply(reply, facts);
    expect(guarded.guarded).toBe(true);
    expect(guarded.kind).toBe("credits");
  });

  it("blocks invented model ids", () => {
    const reply = "You should use hailuo-9-9 — it is our newest video model.";
    const guarded = guardAssistantReply(reply, facts);
    expect(guarded.guarded).toBe(true);
    expect(guarded.reply).toBe(ASSISTANT_MISSING_INFO_REPLY);
    expect(guarded.reason).toMatch(/unknown_model_id/);
  });

  it("blocks invented pack prices", () => {
    const reply = "The Starter plan costs $49.00/mo on ZorixaAI.";
    const guarded = guardAssistantReply(reply, facts);
    expect(guarded.guarded).toBe(true);
    expect(guarded.reply).toBe(ASSISTANT_MISSING_INFO_REPLY);
    expect(guarded.reason).toMatch(/unknown_pack_price/);
  });

  it("blocks claiming external tools as Zorixa offerings", () => {
    const reply = "Zorixa offers Midjourney and Runway inside the studio.";
    const guarded = guardAssistantReply(reply, facts);
    expect(guarded.guarded).toBe(true);
    expect(guarded.reply).toBe(ASSISTANT_MISSING_INFO_REPLY);
  });

  it("blocks invented personal credit balances", () => {
    const reply = "You currently have 999 credits left on your account.";
    const guarded = guardAssistantReply(reply, facts);
    expect(guarded.guarded).toBe(true);
    expect(guarded.kind).toBe("credits");
    expect(guarded.reply).toBe(ASSISTANT_MISSING_INFO_REPLY);
  });

  it("allows decorative dollar amounts inside creative prompts", () => {
    const reply =
      "Prompt: a $200 luxury perfume bottle on marble, soft daylight, shallow depth of field.";
    expect(findAssistantHallucination(reply, facts)).toBeNull();
  });

  it("still blocks invented billing prices", () => {
    const reply = "The Starter plan costs $49.00/mo on ZorixaAI.";
    expect(findAssistantHallucination(reply, facts)).toMatch(/unknown_pack_price/);
  });
});

describe("catalog grounding integrity", () => {
  it("never exposes empty model or pack catalogs to the prompt builder", () => {
    const grounding = fixtureGrounding();
    expect(grounding.models.length).toBeGreaterThan(5);
    expect(grounding.pricing.packs.length).toBe(CREDIT_PACKS.length);
    expect(grounding.faq.length).toBe(PUBLIC_FAQ_ITEMS.length);

    const ids = new Set(grounding.models.map((m) => m.id));
    expect(ids.has("hailuo-2-3")).toBe(true);
    expect(ids.has("seedance-2")).toBe(true);
    expect(ids.has("midjourney-v7")).toBe(false);
    expect(ids.has("sora-2")).toBe(false);
  });
});
