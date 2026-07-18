/**
 * Canonical refusal / scope replies for ZorixaAI Assistant.
 * Keep these exact — system prompt + backend guard both use them.
 */

export const ASSISTANT_MISSING_INFO_REPLY =
  "I'm unable to find accurate information for that request. Please contact our support team at support@zorixaai.com and we'll be happy to help.";

export const ASSISTANT_OFF_TOPIC_REPLY =
  "I'm specialized in ZorixaAI only — models, pricing, credits, studio workflows, and product help. For topics unrelated to ZorixaAI, please use a general AI assistant.";

/** Live pricing / settings / provider behavior not present in the current session. */
export const ASSISTANT_INSUFFICIENT_LIVE_INFO_REPLY =
  "I don't have enough live information to confirm that.";

/** Shown when live UI Generate credits disagree with the last backend required credits. */
export const ASSISTANT_PRICING_MISMATCH_REPLY =
  "There appears to be a pricing mismatch between the displayed credits and the backend calculation. This is likely a bug. Please refresh the page or contact support if it persists.";

export type HallucinationKind =
  | "models"
  | "pricing"
  | "credits"
  | "features"
  | "other";

/** Topics that clearly fall outside ZorixaAI product support. */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(weather|forecast|temperature)\b/i,
  /\b(stock market|bitcoin|crypto trading)\b/i,
  /\b(who (won|will win)|sports score|football match|nba|premier league|world cup)\b/i,
  /\b(write (?:me )?(?:a |an )?(?:python|javascript|java|c\+\+)(?:\s+\w+){0,4}\s+(?:script|function|code|algorithm))\b/i,
  /\b(homework|essay about|solve this math|calculus)\b/i,
  /\b(medical (advice|diagnosis)|prescribe|symptom)\b/i,
  /\b(legal advice|lawsuit|divorce lawyer)\b/i,
  /\b(recipe for|cook(ing)? (dinner|chicken)|how to bake)\b/i,
  /\b(translate this (?:to|into) (?:french|spanish|german|chinese))\b/i,
  /\b(who is the president|capital of france|population of)\b/i,
  /\b(tell me a joke|horoscope|astrology)\b/i
];

/** Mentions that usually mean the user is asking about ZorixaAI. */
const ZORIXA_SCOPE_PATTERNS: RegExp[] = [
  /\bzorixa\b/i,
  /\bcredit(s)?\b/i,
  /\bpricing|price|plan|starter|ultra|creator\b/i,
  /\b(model|hailuo|seedance|kling|veo|wan|flux|seedream|vidu|happyhorse)\b/i,
  /\b(video|image|studio|prompt|generate|ugc|tts|speech)\b/i,
  /\b(billing|refund|subscription|support|faq|account)\b/i,
  /\b(duration|quality|aspect ratio|720p|1080p)\b/i
];

export function isLikelyOffTopicAssistantQuery(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  if (ZORIXA_SCOPE_PATTERNS.some((re) => re.test(text))) return false;
  return OFF_TOPIC_PATTERNS.some((re) => re.test(text));
}

/** External / invented products that must never be claimed as ZorixaAI offerings. */
const EXTERNAL_AS_ZORIXA_CLAIM: RegExp[] = [
  /\b(?:zorixa(?:ai)?|we|our (?:platform|studio|app))\s+(?:offers?|supports?|includes?|has|provide[sd]?)\s+(?:midjourney|runway|pika|sora|luma dream machine|elevenlabs|heygen|chatgpt|claude)\b/i,
  /\b(?:midjourney|runway gen-?[34]|openai sora|sora 2)\s+(?:is available|on zorixa|in (?:our|the) studio)\b/i
];

/** Invented product features that are not in Zorixa grounding. */
const INVENTED_FEATURE_CLAIM: RegExp[] = [
  /\b(?:unlimited free credits|lifetime free plan|on-?premise deployment|self-hosted zorixa)\b/i,
  /\b(?:we|zorixa)\s+(?:offer|provide|include)\s+(?:white-?label|custom enterprise sso|dedicated gpu cluster)\b/i
];

export type AssistantGroundingFacts = {
  modelIds: Set<string>;
  modelLabels: Set<string>;
  packPricesUsd: Set<string>;
  packNames: Set<string>;
  allowedCredits: Set<number>;
  userCredits: number | null;
  uiEstimatedCredits: number | null;
  backendCreditsRequired: number | null;
};

export function buildGroundingFacts(input: {
  models: Array<{ id: string; label: string }>;
  packs: Array<{ name: string; monthlyUsd: number; yearlyUsd?: number; credits: number }>;
  pricingModels: Array<{ creditsCharged: number }>;
  userCredits?: number | null;
  uiEstimatedCredits?: number | null;
  backendCreditsRequired?: number | null;
  backendCreditsBalance?: number | null;
}): AssistantGroundingFacts {
  const modelIds = new Set(input.models.map((m) => m.id.toLowerCase()));
  const modelLabels = new Set(input.models.map((m) => m.label.toLowerCase()));
  const packPricesUsd = new Set<string>();
  for (const p of input.packs) {
    for (const n of [p.monthlyUsd, p.yearlyUsd].filter((v): v is number => typeof v === "number")) {
      packPricesUsd.add(String(n));
      packPricesUsd.add(n.toFixed(2));
      packPricesUsd.add(n.toFixed(2).replace(/\.00$/, ""));
    }
  }
  const packNames = new Set(input.packs.map((p) => p.name.toLowerCase()));
  const allowedCredits = new Set<number>();
  for (const p of input.packs) allowedCredits.add(p.credits);
  for (const m of input.pricingModels) {
    if (Number.isFinite(m.creditsCharged)) allowedCredits.add(m.creditsCharged);
  }
  const userCredits =
    typeof input.userCredits === "number" && Number.isFinite(input.userCredits)
      ? input.userCredits
      : null;
  if (userCredits !== null) allowedCredits.add(userCredits);

  const uiEstimatedCredits =
    typeof input.uiEstimatedCredits === "number" && Number.isFinite(input.uiEstimatedCredits)
      ? input.uiEstimatedCredits
      : null;
  const backendCreditsRequired =
    typeof input.backendCreditsRequired === "number" &&
    Number.isFinite(input.backendCreditsRequired)
      ? input.backendCreditsRequired
      : null;
  const backendCreditsBalance =
    typeof input.backendCreditsBalance === "number" && Number.isFinite(input.backendCreditsBalance)
      ? input.backendCreditsBalance
      : null;

  if (uiEstimatedCredits !== null) allowedCredits.add(uiEstimatedCredits);
  if (backendCreditsRequired !== null) allowedCredits.add(backendCreditsRequired);
  if (backendCreditsBalance !== null) allowedCredits.add(backendCreditsBalance);

  return {
    modelIds,
    modelLabels,
    packPricesUsd,
    packNames,
    allowedCredits,
    userCredits,
    uiEstimatedCredits,
    backendCreditsRequired
  };
}

function normalizePriceToken(raw: string): string {
  return raw.replace(/,/g, "").replace(/\$/g, "").trim();
}

export function classifyHallucinationKind(reason: string | null): HallucinationKind | null {
  if (!reason) return null;
  if (
    reason.startsWith("unknown_model_id:") ||
    reason === "external_product_claimed_as_zorixa"
  ) {
    return "models";
  }
  if (reason.startsWith("unknown_pack_price:")) return "pricing";
  if (reason.startsWith("unknown_credit_balance:") || reason.startsWith("unknown_credit_amount:")) {
    return "credits";
  }
  if (reason === "invented_feature_claim") return "features";
  return "other";
}

/**
 * Returns a short reason when the reply invents product facts not present in grounding.
 * Returns null when no clear hallucination signal is found.
 */
export function findAssistantHallucination(
  reply: string,
  facts: AssistantGroundingFacts
): string | null {
  const text = reply.trim();
  if (!text) return "empty_reply";

  for (const re of EXTERNAL_AS_ZORIXA_CLAIM) {
    if (re.test(text)) return "external_product_claimed_as_zorixa";
  }

  for (const re of INVENTED_FEATURE_CLAIM) {
    if (re.test(text)) return "invented_feature_claim";
  }

  // Composer-style ids in the reply must exist in the catalog.
  const idMatches = text.match(/\b[a-z][a-z0-9]*(?:-[a-z0-9]+){1,5}\b/gi) ?? [];
  for (const raw of idMatches) {
    const id = raw.toLowerCase();
    if (!/\d/.test(id)) continue;
    if (!id.includes("-")) continue;
    if (
      /^(support@|https?|www|mp4|1080p|720p|480p|4k|text-to|image-to|ugc)$/i.test(id)
    ) {
      continue;
    }
    const looksLikeComposerId =
      /^(gpt|nano|seedream|flux|wan|kling|seedance|hailuo|google|vidu|grok|gemini|happyhorse|omni|veed|atlas|infinitetalk|zorixa)/i.test(
        id
      );
    if (!looksLikeComposerId) continue;
    if (!facts.modelIds.has(id)) return `unknown_model_id:${id}`;
  }

  // Dollar amounts that look like Zorixa pack/plan prices must match credit packs.
  // Ignore decorative prices inside creative prompts (e.g. "$200 perfume bottle").
  const priceMatches = text.match(/\$\s?\d+(?:\.\d{1,2})?/g) ?? [];
  for (const raw of priceMatches) {
    const idx = text.toLowerCase().indexOf(raw.toLowerCase().replace(/\s/g, ""));
    const start = Math.max(0, (idx === -1 ? text.indexOf(raw) : idx) - 48);
    const end = Math.min(text.length, (idx === -1 ? text.indexOf(raw) : idx) + raw.length + 48);
    const window = text.slice(start, end).toLowerCase();
    const looksLikeBilling =
      /\b(plan|pack|\/mo|per month|monthly|yearly|subscription|starter|pro|creator|ultra|credits?|pricing|price is|costs?)\b/.test(
        window
      );
    if (!looksLikeBilling) continue;

    const amount = normalizePriceToken(raw);
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 5) continue;
    if (!facts.packPricesUsd.has(amount) && !facts.packPricesUsd.has(n.toFixed(2))) {
      return `unknown_pack_price:${amount}`;
    }
  }

  // Invented personal credit balances ("you have 999 credits") must match session or catalog.
  const balancePatterns = [
    /\byou (?:currently )?have\s+([\d,]+)\s+credits?\b/gi,
    /\byour (?:credit )?balance(?: is|:)\s*([\d,]+)\b/gi,
    /\bcredits? (?:left|remaining)(?:[:\s]+)([\d,]+)\b/gi
  ];
  for (const re of balancePatterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const n = Number(match[1]!.replace(/,/g, ""));
      if (!Number.isFinite(n)) continue;
      if (facts.userCredits !== null && n === facts.userCredits) continue;
      if (facts.allowedCredits.has(n)) continue;
      return `unknown_credit_balance:${n}`;
    }
  }

  // Never allow invented credit arithmetic (e.g. "169 × 2 = 338").
  if (
    /\b\d{2,5}\s*[×x*]\s*\d{1,5}\b/i.test(text) &&
    /\bcredits?\b/i.test(text)
  ) {
    return "unknown_credit_amount:manual_calculation";
  }

  // "need N" / "requires N credits" must match live UI estimate, backend required, packs, or catalog.
  const needPatterns = [
    /\bneed(?:s)?\s+([\d,]+)\s+credits?\b/gi,
    /\brequires?\s+([\d,]+)\s+credits?\b/gi,
    /\bshows?\s+([\d,]+)\s+credits?\b/gi,
    /\b(?:ui|generate button|displayed)\s*[:\-]?\s*([\d,]+)\s+credits?\b/gi,
    /\b(?:backend|api)\s*[:\-]?\s*([\d,]+)\s+credits?\b/gi
  ];
  for (const re of needPatterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const n = Number(match[1]!.replace(/,/g, ""));
      if (!Number.isFinite(n)) continue;
      if (facts.allowedCredits.has(n)) continue;
      return `unknown_credit_amount:${n}`;
    }
  }

  return null;
}

/** Force safe replies when the model drifts outside grounded facts. */
export function guardAssistantReply(
  reply: string,
  facts: AssistantGroundingFacts
): { reply: string; guarded: boolean; reason: string | null; kind: HallucinationKind | null } {
  const reason = findAssistantHallucination(reply, facts);
  if (!reason) return { reply, guarded: false, reason: null, kind: null };
  return {
    reply: ASSISTANT_MISSING_INFO_REPLY,
    guarded: true,
    reason,
    kind: classifyHallucinationKind(reason)
  };
}
