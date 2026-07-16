import { requireAtlasCloudApiKey } from "@/lib/env";

import type { ModerationCategory } from "./constants";

export const MEDIA_MODERATION_MODEL = "google/gemini-2.5-flash-lite";
export const ATLAS_CHAT_BASE = "https://api.atlascloud.ai/v1";

export type MediaKind = "image" | "video";

export type MediaModerationLabel = "SAFE" | "NUDITY" | "SEXUAL";

export type MediaModerationResult =
  | { blocked: false; label: "SAFE"; confidence: number; model: string }
  | {
      blocked: true;
      label: "NUDITY" | "SEXUAL";
      category: Extract<ModerationCategory, "nudity" | "sexual_content">;
      confidence: number;
      model: string;
      pattern: string;
    }
  | { blocked: true; error: true; reason: string };

const CLASSIFIER_SYSTEM = `You classify uploaded media for an AI generation platform.
Reply with exactly one token: SAFE or NUDITY or SEXUAL
Rules:
- NUDITY = exposed genitals, bare breasts/nipples, fully nude body
- SEXUAL = explicit sexual acts, pornography, clear sexual activity
- SAFE = clothed people, fashion, swimwear, lingerie without explicit nudity, products, landscapes
If clearly nude genitals or breasts are visible, answer NUDITY.`;

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string } | string;
  msg?: string;
};

function parseLabel(raw: string | null | undefined): MediaModerationLabel | null {
  if (!raw) return null;
  const text = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, " ");
  if (/\bSEXUAL\b/.test(text) || /\bPORN/.test(text)) return "SEXUAL";
  if (/\bNUDITY\b/.test(text) || /\bNUDE\b/.test(text) || /\bNSFW\b/.test(text)) {
    return "NUDITY";
  }
  if (/\bSAFE\b/.test(text)) return "SAFE";
  return null;
}

function looksLikeVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) || /\/video/i.test(url);
}

/**
 * Classify a public https media URL for nudity / explicit sexual content.
 * Uses Atlas Cloud Gemini Flash Lite (vision). Fail-closed on classifier errors.
 */
export async function moderateMediaUrl(
  url: string,
  kind?: MediaKind
): Promise<MediaModerationResult> {
  const mediaKind: MediaKind = kind ?? (looksLikeVideoUrl(url) ? "video" : "image");
  let apiKey: string;
  try {
    apiKey = requireAtlasCloudApiKey();
  } catch {
    return {
      blocked: true,
      error: true,
      reason: "Media moderation unavailable (missing ATLASCLOUD_API_KEY)"
    };
  }

  const contentParts: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `Classify this ${mediaKind}. Reply with SAFE or NUDITY or SEXUAL only.`
    }
  ];

  const mediaParts: Array<Record<string, unknown>> =
    mediaKind === "video"
      ? [
          { type: "video_url", video_url: { url } },
          { type: "image_url", image_url: { url } }
        ]
      : [{ type: "image_url", image_url: { url } }];

  async function runOnce(parts: Array<Record<string, unknown>>): Promise<MediaModerationResult> {
    const res = await fetch(`${ATLAS_CHAT_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MEDIA_MODERATION_MODEL,
        max_tokens: 32,
        temperature: 0,
        messages: [
          { role: "system", content: CLASSIFIER_SYSTEM },
          { role: "user", content: [...contentParts.slice(0, 1), ...parts] }
        ]
      }),
      signal: AbortSignal.timeout(25_000)
    });

    const json = (await res.json()) as ChatCompletionResponse;
    if (!res.ok) {
      const msg =
        (typeof json.error === "object" && json.error?.message) ||
        (typeof json.error === "string" ? json.error : null) ||
        json.msg ||
        `Media classifier HTTP ${res.status}`;
      return { blocked: true, error: true, reason: String(msg) };
    }

    const content = json.choices?.[0]?.message?.content ?? null;
    const label = parseLabel(content);
    if (!label) {
      return {
        blocked: true,
        error: true,
        reason: `Media classifier returned unparseable label: ${String(content).slice(0, 80)}`
      };
    }

    if (label === "SAFE") {
      return {
        blocked: false,
        label: "SAFE",
        confidence: 1,
        model: MEDIA_MODERATION_MODEL
      };
    }

    return {
      blocked: true,
      label,
      category: label === "SEXUAL" ? "sexual_content" : "nudity",
      confidence: 1,
      model: MEDIA_MODERATION_MODEL,
      pattern: `media:${label.toLowerCase()}`
    };
  }

  try {
    // Prefer a single part; for video try video_url then image_url fallback.
    if (mediaKind === "video") {
      const primary = await runOnce([mediaParts[0]!]);
      if (!("error" in primary && primary.error)) return primary;
      return await runOnce([mediaParts[1]!]);
    }
    return await runOnce(mediaParts);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Media classifier failed";
    return { blocked: true, error: true, reason };
  }
}

/** Classify multiple media URLs; returns first block / error. */
export async function moderateMediaUrls(
  urls: Array<{ url: string; kind?: MediaKind } | string>
): Promise<MediaModerationResult & { url?: string }> {
  for (const entry of urls) {
    const url = typeof entry === "string" ? entry : entry.url;
    const kind = typeof entry === "string" ? undefined : entry.kind;
    if (!url?.trim()) continue;
    const result = await moderateMediaUrl(url.trim(), kind);
    if (result.blocked) return { ...result, url: url.trim() };
  }
  return {
    blocked: false,
    label: "SAFE",
    confidence: 1,
    model: MEDIA_MODERATION_MODEL
  };
}
