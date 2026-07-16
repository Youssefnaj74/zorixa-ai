import { NextResponse } from "next/server";

import {
  CONTENT_POLICY_VIOLATION_CODE,
  CONTENT_POLICY_VIOLATION_MESSAGE,
  type ModerationWorkflow
} from "./constants";
import { logModerationBlock } from "./log-block";
import {
  moderateMediaUrls,
  type MediaKind
} from "./moderate-media";

export type MediaPolicyItem = {
  url: string;
  kind?: MediaKind;
};

export type EnforceMediaContentPolicyInput = {
  userId: string | null;
  workflow: ModerationWorkflow;
  route: string;
  media: MediaPolicyItem[];
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Screen uploaded/reference images and videos for nudity / sexual content.
 * Returns HTTP 422 before any provider call or credit deduction.
 * Fail-closed (503) if the classifier is unavailable.
 */
export async function enforceMediaContentPolicy(
  input: EnforceMediaContentPolicyInput
): Promise<NextResponse | null> {
  const media = input.media.filter((m) => typeof m.url === "string" && m.url.trim());
  if (media.length === 0) return null;

  const result = await moderateMediaUrls(media);

  if (!result.blocked) return null;

  if ("error" in result && result.error) {
    console.error("[content-moderation] media classifier unavailable", result.reason);
    return NextResponse.json(
      {
        error:
          "Content screening is temporarily unavailable. Please try again in a moment.",
        code: "MEDIA_MODERATION_UNAVAILABLE"
      },
      { status: 503 }
    );
  }

  if (!("category" in result)) return null;

  await logModerationBlock({
    userId: input.userId,
    workflow: input.workflow,
    route: input.route,
    category: result.category,
    matchedPattern: result.pattern,
    promptPreview: `[media:${result.label}] ${result.url ?? media[0]?.url ?? ""}`,
    ip: input.ip,
    metadata: {
      ...input.metadata,
      mediaUrl: result.url ?? null,
      mediaLabel: result.label,
      mediaModel: result.model
    }
  });

  return NextResponse.json(
    {
      error: CONTENT_POLICY_VIOLATION_MESSAGE,
      code: CONTENT_POLICY_VIOLATION_CODE
    },
    { status: 422 }
  );
}
