import {
  ASSISTANT_MISSING_INFO_REPLY,
  ASSISTANT_OFF_TOPIC_REPLY,
  buildGroundingFacts,
  classifyHallucinationKind,
  findAssistantHallucination,
  type HallucinationKind
} from "@/lib/zorixa-assistant-replies";
import type { ZorixaAssistantGrounding } from "@/lib/zorixa-assistant-types";
import type { EvalQuestion } from "@/lib/zorixa-assistant-eval/questions";

export type EvalScoreResult = {
  id: string;
  category: string;
  question: string;
  passed: boolean;
  reasons: string[];
  reply: string;
  expect: EvalQuestion["expect"];
  guardedOffTopicShortCircuit: boolean;
  hallucinationReason: string | null;
  hallucinationKind: HallucinationKind | null;
  incorrectSupportResponse: boolean;
  incorrectOffTopicResponse: boolean;
};

function includesAny(text: string, needles: string[] | undefined): boolean {
  if (!needles?.length) return true;
  const lower = text.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

function includesAll(text: string, needles: string[] | undefined): boolean {
  if (!needles?.length) return true;
  const lower = text.toLowerCase();
  return needles.every((n) => lower.includes(n.toLowerCase()));
}

function excludesAll(text: string, needles: string[] | undefined): boolean {
  if (!needles?.length) return true;
  const lower = text.toLowerCase();
  return needles.every((n) => !lower.includes(n.toLowerCase()));
}

function isMissingInfoReply(reply: string): boolean {
  const t = reply.trim();
  if (t === ASSISTANT_MISSING_INFO_REPLY) return true;
  const lower = t.toLowerCase();
  if (!lower.includes("support@zorixaai.com")) return false;
  // Avoid false positives when a grounded answer merely mentions support as a tip.
  return (
    lower.startsWith("i'm unable to find") ||
    lower.startsWith("i am unable to find") ||
    lower.startsWith("i don't have that information") ||
    (lower.includes("unable to find accurate information") && t.length < 320)
  );
}

function isOffTopicReply(reply: string): boolean {
  const t = reply.trim();
  if (t === ASSISTANT_OFF_TOPIC_REPLY) return true;
  const lower = t.toLowerCase();
  return (
    lower.includes("specialized in zorixa") &&
    (lower.includes("general ai") || lower.includes("unrelated"))
  );
}

function looksPromptLike(reply: string): boolean {
  const t = reply.trim();
  if (t.length < 40) return false;
  if (isMissingInfoReply(t) || isOffTopicReply(t)) return false;
  return true;
}

export function scoreAssistantEvalReply(input: {
  question: EvalQuestion;
  reply: string;
  grounding: ZorixaAssistantGrounding;
  shortCircuitedOffTopic?: boolean;
}): EvalScoreResult {
  const { question, reply, grounding } = input;
  const reasons: string[] = [];
  const facts = buildGroundingFacts({
    models: grounding.models,
    packs: grounding.pricing.packs,
    pricingModels: grounding.pricing.models,
    userCredits: grounding.user?.credits ?? null,
    uiEstimatedCredits: grounding.liveGeneration.uiEstimatedCredits,
    backendCreditsRequired: grounding.liveGeneration.backendCreditsRequired,
    backendCreditsBalance: grounding.liveGeneration.backendCreditsBalance
  });

  const hallucination = findAssistantHallucination(reply, facts);
  if (hallucination) {
    reasons.push(`hallucination:${hallucination}`);
  }

  if (!excludesAll(reply, question.mustNotInclude)) {
    reasons.push("contains_banned_phrase");
  }

  switch (question.expect) {
    case "off_topic": {
      if (!isOffTopicReply(reply)) {
        reasons.push("expected_off_topic_reply");
      }
      break;
    }
    case "missing_info": {
      if (!isMissingInfoReply(reply)) {
        reasons.push("expected_missing_info_support_fallback");
      }
      break;
    }
    case "grounded": {
      if (isOffTopicReply(reply)) reasons.push("unexpected_off_topic");
      if (isMissingInfoReply(reply)) reasons.push("unexpected_missing_info");
      if (!includesAny(reply, question.mustIncludeAny)) {
        reasons.push("missing_required_any");
      }
      if (!includesAll(reply, question.mustIncludeAll)) {
        reasons.push("missing_required_all");
      }
      if (question.expectPromptLike && !looksPromptLike(reply)) {
        reasons.push("expected_prompt_like_answer");
      }
      break;
    }
    case "grounded_or_missing": {
      if (isOffTopicReply(reply)) reasons.push("unexpected_off_topic");
      const ok =
        isMissingInfoReply(reply) ||
        (includesAny(reply, question.mustIncludeAny) && !hallucination);
      if (!ok) reasons.push("expected_grounded_or_missing");
      break;
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  const passed = uniqueReasons.length === 0;

  const incorrectSupportResponse =
    (question.expect === "missing_info" && !isMissingInfoReply(reply)) ||
    (question.expect === "grounded" && isMissingInfoReply(reply));
  // grounded_or_missing: either path is acceptable — never count as incorrect support.

  const incorrectOffTopicResponse =
    (question.expect === "off_topic" && !isOffTopicReply(reply)) ||
    (question.expect !== "off_topic" && isOffTopicReply(reply));

  return {
    id: question.id,
    category: question.category,
    question: question.question,
    passed,
    reasons: uniqueReasons,
    reply,
    expect: question.expect,
    guardedOffTopicShortCircuit: Boolean(input.shortCircuitedOffTopic),
    hallucinationReason: hallucination,
    hallucinationKind: classifyHallucinationKind(hallucination),
    incorrectSupportResponse,
    incorrectOffTopicResponse
  };
}
