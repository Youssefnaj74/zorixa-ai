/** Pull a human-readable `message` from Atlas error strings (poll / worker). */
export function parseAtlasErrorMessage(raw: string | null | undefined): string {
  if (!raw) return "Atlas prediction failed";
  const t = raw.trim();

  const bodyMatch = t.match(/body:\s*(\{[\s\S]*\})\s*$/i) ?? t.match(/body:\s*(\{[\s\S]*\})/i);
  if (bodyMatch?.[1]) {
    try {
      const parsed = JSON.parse(bodyMatch[1]) as { message?: string };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      /* ignore malformed JSON */
    }
  }

  if (t.startsWith("{")) {
    try {
      const parsed = JSON.parse(t) as { message?: string };
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      /* ignore */
    }
  }

  return t;
}

/** Seedance / Atlas blocks I2V when the start frame may depict a real person. */
export function isAtlasRealPersonImageError(error: string | null | undefined): boolean {
  const lower = parseAtlasErrorMessage(error).toLowerCase();
  return (
    lower.includes("real person") ||
    lower.includes("realistic person") ||
    lower.includes("may contain real")
  );
}

function formatRealPersonImageBlockedForUi(): string {
  return [
    "This image was blocked: it may show a real person (ByteDance / Seedance policy — not a Zorixa bug).",
    "What to try:",
    "• Product or object photo with no human faces",
    "• AI-generated or illustrated image (no recognizable real face)",
    "• Text to Video (no reference photo)",
    "• Kling 3.0 Pro — often accepts images Seedance rejects",
    "",
    "الصورة تحتوي على وجه بشري — جرّب صورة منتج بلا أشخاص، أو صورة مولّدة بالذكاء الاصطناعي، أو Text to Video."
  ].join("\n");
}

function atlasVideoFailureHint(message: string): string | null {
  const lower = message.toLowerCase();

  if (isAtlasRealPersonImageError(message)) {
    return null;
  }

  if (lower.includes("nsfw") || lower.includes("safety") || lower.includes("moderation")) {
    return "Atlas content filter rejected this input. Try a different image or prompt.";
  }

  if (lower.includes("balance") || lower.includes("insufficient") || lower.includes("credit")) {
    return "Check your Atlas Cloud account balance on atlascloud.ai.";
  }

  return null;
}

/** User-facing message when Atlas video generation fails. */
export function formatAtlasVideoFailureForUi(
  error: string | null | undefined,
  opts?: {
    generateAudio?: boolean;
    hostIsProduction?: boolean;
    /** When poll only returns "task failed", I2V failures are often real-person policy. */
    action?: "text" | "image";
  }
): string {
  if (isAtlasRealPersonImageError(error)) {
    return formatRealPersonImageBlockedForUi();
  }

  const parsed = parseAtlasErrorMessage(error);

  if (parsed.toLowerCase() === "task failed" && opts?.action === "image") {
    return [
      formatRealPersonImageBlockedForUi(),
      'Atlas only returned "task failed". Open the eye icon in Request History on atlascloud.ai for the full rejection reason.'
    ].join("\n\n");
  }

  const parts = [parsed];

  const hint = atlasVideoFailureHint(parsed);
  if (hint) parts.push(hint);

  if (parsed.toLowerCase() === "task failed") {
    parts.push(
      "Atlas Cloud rejected this job (no detailed reason). Check Request History on atlascloud.ai for this prediction."
    );
    if (opts?.hostIsProduction) {
      parts.push(
        "zorixaai.com uses ATLASCLOUD_API_KEY from Vercel — it may differ from your local .env.local key or balance."
      );
    }
  }

  if (opts?.generateAudio) {
    parts.push(
      "Native audio was enabled. If failures continue, try Audio Off once to isolate — otherwise check Atlas balance."
    );
  }

  return parts.join("\n\n");
}
