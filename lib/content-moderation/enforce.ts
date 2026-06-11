import { NextResponse } from "next/server";

import {
  CONTENT_POLICY_VIOLATION_CODE,
  CONTENT_POLICY_VIOLATION_MESSAGE,
  type ModerationWorkflow
} from "./constants";
import { logModerationBlock } from "./log-block";
import { moderateTexts, type ModerationResult } from "./moderate-prompt";

export type EnforceContentPolicyInput = {
  userId: string | null;
  workflow: ModerationWorkflow;
  route: string;
  texts: Array<string | null | undefined>;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

function primaryPrompt(texts: Array<string | null | undefined>): string {
  for (const text of texts) {
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return "";
}

export async function enforceContentPolicy(
  input: EnforceContentPolicyInput
): Promise<NextResponse | null> {
  const result: ModerationResult = moderateTexts(input.texts);
  if (!result.blocked) return null;

  await logModerationBlock({
    userId: input.userId,
    workflow: input.workflow,
    route: input.route,
    category: result.category,
    matchedPattern: result.pattern,
    promptPreview: primaryPrompt(input.texts),
    ip: input.ip,
    metadata: input.metadata
  });

  return NextResponse.json(
    {
      error: CONTENT_POLICY_VIOLATION_MESSAGE,
      code: CONTENT_POLICY_VIOLATION_CODE
    },
    { status: 422 }
  );
}

export function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
