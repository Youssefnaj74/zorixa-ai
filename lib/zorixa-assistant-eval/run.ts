import fs from "node:fs";
import path from "node:path";

import { atlasChatCompletion } from "@/lib/atlas-chat";
import { buildStaticAssistantGrounding } from "@/lib/zorixa-assistant-grounding";
import type { ZorixaAssistantClientContext } from "@/lib/zorixa-assistant-types";
import { buildZorixaAssistantSystemPrompt } from "@/lib/zorixa-assistant-prompt";
import {
  ASSISTANT_OFF_TOPIC_REPLY,
  buildGroundingFacts,
  guardAssistantReply,
  isLikelyOffTopicAssistantQuery
} from "@/lib/zorixa-assistant-replies";
import {
  ASSISTANT_REFUSAL_RETRY_SUFFIX,
  isUnexpectedAssistantRefusal
} from "@/lib/zorixa-assistant-retry";
import {
  ASSISTANT_EVAL_QUESTION_BANK,
  assertEvalQuestionCount,
  type EvalQuestion
} from "@/lib/zorixa-assistant-eval/questions";
import { PRIOR_FAILURE_ROOT_CAUSES } from "@/lib/zorixa-assistant-eval/root-causes";
import { scoreAssistantEvalReply, type EvalScoreResult } from "@/lib/zorixa-assistant-eval/score";

export type ZeroHallucinationAudit = {
  hallucinatedModels: number;
  hallucinatedPricing: number;
  hallucinatedCredits: number;
  hallucinatedFeatures: number;
  incorrectSupportResponses: number;
  incorrectOffTopicResponses: number;
  allClear: boolean;
};

export type EvalReport = {
  generatedAt: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  passRatePercent: string;
  meetsReleaseGate: boolean;
  releaseGate: number;
  confidenceScore: number;
  confidencePercent: string;
  productionReadiness: "not_ready" | "ready_for_chat_ui";
  productionReadinessNotes: string[];
  zeroHallucinationAudit: ZeroHallucinationAudit;
  byCategory: Record<string, { total: number; passed: number; passRate: number }>;
  failedQuestions: Array<{
    id: string;
    category: string;
    question: string;
    reasons: string[];
    replyPreview: string;
  }>;
  priorFailureRootCauses: typeof import("@/lib/zorixa-assistant-eval/root-causes").PRIOR_FAILURE_ROOT_CAUSES;
  suggestedImprovements: string[];
  results: EvalScoreResult[];
};

const RELEASE_GATE = 0.95;
const CONCURRENCY = 4;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return out;
}

function groundingForQuestion(question: EvalQuestion) {
  return buildStaticAssistantGrounding({
    user: {
      credits: question.userCredits ?? 395,
      plan: question.userPlan ?? (question.isPremium ? "Premium" : "Starter"),
      isPremium: question.isPremium ?? false
    },
    client: question.client ?? null
  });
}

async function answerQuestion(question: EvalQuestion): Promise<{
  reply: string;
  shortCircuitedOffTopic: boolean;
}> {
  if (isLikelyOffTopicAssistantQuery(question.question)) {
    return { reply: ASSISTANT_OFF_TOPIC_REPLY, shortCircuitedOffTopic: true };
  }

  const grounding = groundingForQuestion(question);
  const systemPrompt = buildZorixaAssistantSystemPrompt(grounding);
  const facts = buildGroundingFacts({
    models: grounding.models,
    packs: grounding.pricing.packs,
    pricingModels: grounding.pricing.models,
    userCredits: grounding.user?.credits ?? null,
    uiEstimatedCredits: grounding.liveGeneration.uiEstimatedCredits,
    backendCreditsRequired: grounding.liveGeneration.backendCreditsRequired,
    backendCreditsBalance: grounding.liveGeneration.backendCreditsBalance
  });

  const completion = await atlasChatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question.question }
    ],
    maxTokens: 700,
    temperature: 0.1
  });

  let guarded = guardAssistantReply(completion.content, facts);

  if (
    isUnexpectedAssistantRefusal({
      userMessage: question.question,
      reply: guarded.reply
    })
  ) {
    const retry = await atlasChatCompletion({
      messages: [
        { role: "system", content: `${systemPrompt}${ASSISTANT_REFUSAL_RETRY_SUFFIX}` },
        { role: "user", content: question.question }
      ],
      maxTokens: 700,
      temperature: 0
    });
    guarded = guardAssistantReply(retry.content, facts);
  }

  return { reply: guarded.reply, shortCircuitedOffTopic: false };
}

function buildSuggestions(failed: EvalScoreResult[]): string[] {
  const suggestions: string[] = [];
  const reasonCounts = new Map<string, number>();
  for (const f of failed) {
    for (const r of f.reasons) {
      reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
    }
  }
  const ranked = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [reason, count] of ranked.slice(0, 8)) {
    if (reason.startsWith("hallucination:")) {
      suggestions.push(
        `Tighten anti-hallucination guard for "${reason}" (failed ${count}x) — expand grounding or harden regex.`
      );
    } else if (reason === "expected_missing_info_support_fallback") {
      suggestions.push(
        `Model often answers instead of support fallback (${count}x) — strengthen missing-info rule or add explicit "unknown" examples in the system prompt.`
      );
    } else if (reason === "missing_required_any" || reason === "missing_required_all") {
      suggestions.push(
        `Grounded answers missing expected facts (${count}x) — add clearer product knowledge bullets or lower temperature.`
      );
    } else if (reason.includes("off_topic")) {
      suggestions.push(
        `Off-topic routing gaps (${count}x) — expand isLikelyOffTopicAssistantQuery patterns.`
      );
    } else {
      suggestions.push(`Address recurring failure "${reason}" (${count}x).`);
    }
  }

  const byCat = new Map<string, number>();
  for (const f of failed) byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1);
  for (const [cat, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    suggestions.push(`Review category "${cat}" (${count} failures) — expand docs or relax/adjust mustInclude expectations.`);
  }

  if (suggestions.length === 0) {
    suggestions.push("No failures — keep regenerating the eval suite as product knowledge grows.");
  }
  return suggestions;
}

export async function runAssistantEvaluation(options?: {
  limit?: number;
  ids?: string[];
}): Promise<EvalReport> {
  assertEvalQuestionCount(100);
  let questions = ASSISTANT_EVAL_QUESTION_BANK;
  if (options?.ids?.length) {
    const idSet = new Set(options.ids);
    questions = questions.filter((q) => idSet.has(q.id));
  }
  if (options?.limit && options.limit > 0) {
    questions = questions.slice(0, options.limit);
  }

  const results = await mapPool(questions, CONCURRENCY, async (question) => {
    try {
      const { reply, shortCircuitedOffTopic } = await answerQuestion(question);
      return scoreAssistantEvalReply({
        question,
        reply,
        grounding: groundingForQuestion(question),
        shortCircuitedOffTopic
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        id: question.id,
        category: question.category,
        question: question.question,
        passed: false,
        reasons: [`runtime_error:${message}`],
        reply: "",
        expect: question.expect,
        guardedOffTopicShortCircuit: false,
        hallucinationReason: null,
        hallucinationKind: null,
        incorrectSupportResponse: false,
        incorrectOffTopicResponse: false
      } satisfies EvalScoreResult;
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const failedResults = results.filter((r) => !r.passed);
  const total = results.length;
  const passRate = total === 0 ? 0 : passed / total;

  const byCategory: EvalReport["byCategory"] = {};
  for (const r of results) {
    const bucket = byCategory[r.category] ?? { total: 0, passed: 0, passRate: 0 };
    bucket.total += 1;
    if (r.passed) bucket.passed += 1;
    bucket.passRate = bucket.total ? bucket.passed / bucket.total : 0;
    byCategory[r.category] = bucket;
  }

  const zeroHallucinationAudit: ZeroHallucinationAudit = {
    hallucinatedModels: results.filter((r) => r.hallucinationKind === "models").length,
    hallucinatedPricing: results.filter((r) => r.hallucinationKind === "pricing").length,
    hallucinatedCredits: results.filter((r) => r.hallucinationKind === "credits").length,
    hallucinatedFeatures: results.filter((r) => r.hallucinationKind === "features").length,
    incorrectSupportResponses: results.filter((r) => r.incorrectSupportResponse).length,
    incorrectOffTopicResponses: results.filter((r) => r.incorrectOffTopicResponse).length,
    allClear: false
  };
  zeroHallucinationAudit.allClear =
    zeroHallucinationAudit.hallucinatedModels === 0 &&
    zeroHallucinationAudit.hallucinatedPricing === 0 &&
    zeroHallucinationAudit.hallucinatedCredits === 0 &&
    zeroHallucinationAudit.hallucinatedFeatures === 0 &&
    zeroHallucinationAudit.incorrectSupportResponses === 0 &&
    zeroHallucinationAudit.incorrectOffTopicResponses === 0;

  // Confidence blends pass rate with hard zero-hallucination / routing audits.
  const confidenceScore =
    passRate * 0.7 +
    (zeroHallucinationAudit.allClear ? 0.25 : 0) +
    (failedResults.length === 0 ? 0.05 : 0);
  const productionReadiness =
    passRate >= RELEASE_GATE && zeroHallucinationAudit.allClear && failedResults.length === 0
      ? "ready_for_chat_ui"
      : "not_ready";
  const productionReadinessNotes: string[] = [];
  if (productionReadiness === "ready_for_chat_ui") {
    productionReadinessNotes.push(
      "Backend assistant meets release gate with zero detected hallucinations on the eval suite."
    );
    productionReadinessNotes.push("Safe to start Chat UI implementation.");
  } else {
    if (passRate < RELEASE_GATE) {
      productionReadinessNotes.push(`Pass rate ${((passRate) * 100).toFixed(1)}% is below ${(RELEASE_GATE * 100).toFixed(0)}% gate.`);
    }
    if (!zeroHallucinationAudit.allClear) {
      productionReadinessNotes.push("Zero-hallucination audit still has open findings.");
    }
    if (failedResults.length > 0) {
      productionReadinessNotes.push(`${failedResults.length} eval question(s) still failing.`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    total,
    passed,
    failed: failedResults.length,
    passRate,
    passRatePercent: `${(passRate * 100).toFixed(1)}%`,
    meetsReleaseGate: passRate >= RELEASE_GATE,
    releaseGate: RELEASE_GATE,
    confidenceScore,
    confidencePercent: `${(confidenceScore * 100).toFixed(1)}%`,
    productionReadiness,
    productionReadinessNotes,
    zeroHallucinationAudit,
    byCategory,
    failedQuestions: failedResults.map((f) => ({
      id: f.id,
      category: f.category,
      question: f.question,
      reasons: f.reasons,
      replyPreview: f.reply.slice(0, 280)
    })),
    priorFailureRootCauses: PRIOR_FAILURE_ROOT_CAUSES,
    suggestedImprovements: buildSuggestions(failedResults),
    results
  };
}

export function formatEvalReportMarkdown(report: EvalReport): string {
  const audit = report.zeroHallucinationAudit;
  const lines: string[] = [
    "# ZorixaAI Assistant Evaluation Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Total questions: **${report.total}**`,
    `- Passed: **${report.passed}**`,
    `- Failed: **${report.failed}**`,
    `- Pass rate: **${report.passRatePercent}**`,
    `- Confidence score: **${report.confidencePercent}**`,
    `- Release gate (≥${(report.releaseGate * 100).toFixed(0)}%): **${report.meetsReleaseGate ? "PASS" : "FAIL"}**`,
    `- Production readiness: **${report.productionReadiness}**`,
    "",
    "## Zero-hallucination audit",
    "",
    `- Hallucinated models: **${audit.hallucinatedModels}**`,
    `- Hallucinated pricing: **${audit.hallucinatedPricing}**`,
    `- Hallucinated credits: **${audit.hallucinatedCredits}**`,
    `- Hallucinated features: **${audit.hallucinatedFeatures}**`,
    `- Incorrect support responses: **${audit.incorrectSupportResponses}**`,
    `- Incorrect off-topic responses: **${audit.incorrectOffTopicResponses}**`,
    `- All clear: **${audit.allClear ? "YES" : "NO"}**`,
    "",
    "## Production readiness notes",
    ""
  ];

  for (const note of report.productionReadinessNotes) {
    lines.push(`- ${note}`);
  }

  lines.push("", "## By category", "");

  for (const [category, stats] of Object.entries(report.byCategory).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(
      `- **${category}**: ${stats.passed}/${stats.total} (${(stats.passRate * 100).toFixed(1)}%)`
    );
  }

  lines.push("", "## Remaining failures", "");
  if (report.failedQuestions.length === 0) {
    lines.push("_None._");
  } else {
    for (const f of report.failedQuestions) {
      lines.push(`### ${f.id} (${f.category})`);
      lines.push(`- Q: ${f.question}`);
      lines.push(`- Reasons: ${f.reasons.join(", ")}`);
      lines.push(`- Reply preview: ${f.replyPreview || "(empty)"}`);
      lines.push("");
    }
  }

  lines.push("", "## Prior 97.3% failures — root causes (not question patches)", "");
  for (const item of report.priorFailureRootCauses) {
    lines.push(`### ${item.id}`);
    lines.push(`- Question: ${item.question}`);
    lines.push(`- Symptom: ${item.symptom}`);
    lines.push(`- Root cause: ${item.rootCause}`);
    lines.push(`- Fix: ${item.fix}`);
    lines.push("");
  }

  lines.push("## Suggested improvements", "");
  for (const s of report.suggestedImprovements) {
    lines.push(`- ${s}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function writeEvalReportFiles(report: EvalReport, outDir: string): {
  jsonPath: string;
  mdPath: string;
} {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "assistant-eval-report.json");
  const mdPath = path.join(outDir, "assistant-eval-report.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPath, formatEvalReportMarkdown(report), "utf8");
  return { jsonPath, mdPath };
}

/** Exported for typed client context checks in tests. */
export type { ZorixaAssistantClientContext };
