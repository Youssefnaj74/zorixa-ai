/**
 * Root-cause notes for the 97.3% → 100% push.
 * These were product/system defects — not one-off question patches.
 */

export const PRIOR_FAILURE_ROOT_CAUSES = [
  {
    id: "m10",
    question: "Is OpenAI Sora available in Video Studio?",
    symptom: "Scored as unexpected_missing_info even though the model correctly said Sora is not available.",
    rootCause:
      "The missing-info detector was too broad: any reply containing support@zorixaai.com plus phrases like \"not available\" / \"please contact\" was treated as the support fallback. A correct grounded denial of Sora availability could therefore look like a missing-info reply.",
    fix:
      "Tighten isMissingInfoReply to only match the canonical support fallback (or short unable-to-find replies), not every answer that mentions support as an optional tip."
  },
  {
    id: "p06",
    question: "Is there a yearly discount?",
    symptom: "Model returned the missing-info support fallback instead of answering from pricing facts.",
    rootCause:
      "Yearly billing existed in CREDIT_PACKS but was not clearly present in the assistant product knowledge / system prompt pricing section, so the model correctly refused rather than invent a discount — grounding was incomplete.",
    fix:
      "Expose yearly pack prices in grounding + prompt pricing section, and document yearly discount explicitly in product knowledge."
  },
  {
    id: "mi06",
    question: "What is the SOC 2 audit report download link?",
    symptom: "Model returned the off-topic specialized-assistant reply instead of the support fallback.",
    rootCause:
      "Scope rules conflated \"unknown Zorixa compliance detail\" with \"unrelated topic\". Compliance/account unknowns are still ZorixaAI questions — they need the missing-info support path, not off-topic.",
    fix:
      "Clarify system prompt: unknown Zorixa product/compliance/account facts → missing-info support reply; off-topic is only for non-Zorixa subjects (weather, sports, homework, etc.)."
  },
  {
    id: "ac03",
    question: "Who founded Zorixa AI?",
    symptom: "Model over-refused with the missing-info support reply even though FAQ/docs already describe an independent founder.",
    rootCause:
      "DeepSeek sometimes treats \"who founded\" as requiring a personal name. When no personal name is published, it falls back to missing-info instead of answering with the grounded FAQ phrase \"independent founder\".",
    fix:
      "Add an explicit founder section to product knowledge, add a hard prompt rule to answer from FAQ without inventing a name, and retry once in backend/eval when founder questions are unexpectedly refused."
  },
  {
    id: "pg02_pi04",
    question: "Prompt generation / improvement (e.g. UGC serum prompt, rewrite product shot)",
    symptom: "Creative prompt answers were replaced by the missing-info support fallback.",
    rootCause:
      "The anti-hallucination price guard treated decorative dollar amounts inside creative prompts (e.g. \"$200 perfume\") as invented Zorixa pack prices, then replaced the whole answer with the support fallback.",
    fix:
      "Only flag dollar amounts when nearby billing context exists (plan/pack/monthly/credits). Also treat prompt-help over-refusals as retryable unexpected refusals."
  },
  {
    id: "mi05",
    question: "When will you add Midjourney to the catalog?",
    symptom: "Eval expected the exact missing-info fallback, but the model gave a safer grounded answer: Midjourney is not offered, no invented date, plus support contact.",
    rootCause:
      "The rubric treated any non-exact support fallback as failure. For roadmap questions, inventing a date is the real hallucination risk; answering \"not in catalog + contact support\" is the preferred product behavior.",
    fix:
      "Score roadmap questions as grounded_or_missing, ban invented ETAs, and prompt the model never to invent launch dates."
  }
] as const;
