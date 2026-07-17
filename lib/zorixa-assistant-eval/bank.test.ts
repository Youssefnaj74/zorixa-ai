import { describe, expect, it } from "vitest";

import { buildStaticAssistantGrounding } from "@/lib/zorixa-assistant-grounding";
import {
  ASSISTANT_EVAL_QUESTION_BANK,
  assertEvalQuestionCount
} from "@/lib/zorixa-assistant-eval/questions";
import { scoreAssistantEvalReply } from "@/lib/zorixa-assistant-eval/score";
import {
  ASSISTANT_MISSING_INFO_REPLY,
  ASSISTANT_OFF_TOPIC_REPLY
} from "@/lib/zorixa-assistant-replies";

describe("assistant eval question bank", () => {
  it("contains at least 100 real-world questions across required categories", () => {
    expect(assertEvalQuestionCount(100)).toBeGreaterThanOrEqual(100);
    const cats = new Set(ASSISTANT_EVAL_QUESTION_BANK.map((q) => q.category));
    for (const required of [
      "model_recommendations",
      "prompt_generation",
      "prompt_improvement",
      "credits",
      "pricing",
      "billing",
      "video_studio",
      "image_studio",
      "voice_cloning",
      "ai_director",
      "api_keys",
      "generation_failures",
      "account",
      "off_topic",
      "missing_information"
    ] as const) {
      expect(cats.has(required)).toBe(true);
    }
  });
});

describe("assistant eval scorer", () => {
  const grounding = buildStaticAssistantGrounding({
    user: { credits: 80, plan: "Starter", isPremium: false }
  });

  it("passes off-topic exact reply", () => {
    const question = ASSISTANT_EVAL_QUESTION_BANK.find((q) => q.id === "ot01")!;
    const result = scoreAssistantEvalReply({
      question,
      reply: ASSISTANT_OFF_TOPIC_REPLY,
      grounding,
      shortCircuitedOffTopic: true
    });
    expect(result.passed).toBe(true);
  });

  it("passes missing-info exact reply", () => {
    const question = ASSISTANT_EVAL_QUESTION_BANK.find((q) => q.id === "mi01")!;
    const result = scoreAssistantEvalReply({
      question,
      reply: ASSISTANT_MISSING_INFO_REPLY,
      grounding
    });
    expect(result.passed).toBe(true);
  });

  it("fails grounded answers that hallucinate pack prices", () => {
    const question = ASSISTANT_EVAL_QUESTION_BANK.find((q) => q.id === "p01")!;
    const result = scoreAssistantEvalReply({
      question,
      reply: "Starter is $49.00/mo.",
      grounding
    });
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("hallucination") || r === "contains_banned_phrase")).toBe(
      true
    );
  });
});
