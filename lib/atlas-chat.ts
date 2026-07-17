/**
 * Atlas Cloud OpenAI-compatible chat completions.
 * LLM base: https://api.atlascloud.ai/v1 (separate from media /api/v1/model).
 *
 * @see https://www.atlascloud.ai/models/deepseek-ai/deepseek-v4-flash
 */

import { requireAtlasCloudApiKey } from "@/lib/env";

export const ATLAS_CHAT_BASE = "https://api.atlascloud.ai/v1";
export const DEEPSEEK_V4_FLASH_MODEL = "deepseek-ai/deepseek-v4-flash";

export class AtlasChatError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AtlasChatError";
  }
}

export type AtlasChatRole = "system" | "user" | "assistant";

export type AtlasChatMessage = {
  role: AtlasChatRole;
  content: string;
};

export type AtlasChatCompletionParams = {
  messages: AtlasChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type AtlasChatCompletionResult = {
  content: string;
  model: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
};

type AtlasChatCompletionResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { role?: string; content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string } | string;
};

function getAtlasApiKey(): string {
  try {
    return requireAtlasCloudApiKey();
  } catch {
    throw new AtlasChatError("Missing ATLASCLOUD_API_KEY", 500);
  }
}

function extractErrorMessage(payload: AtlasChatCompletionResponse, fallback: string): string {
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error.trim();
  if (payload.error && typeof payload.error === "object" && payload.error.message?.trim()) {
    return payload.error.message.trim();
  }
  return fallback;
}

/** Non-streaming chat completion via Atlas Cloud (DeepSeek V4 Flash by default). */
export async function atlasChatCompletion(
  params: AtlasChatCompletionParams
): Promise<AtlasChatCompletionResult> {
  const apiKey = getAtlasApiKey();
  const model = params.model?.trim() || DEEPSEEK_V4_FLASH_MODEL;
  const maxAttempts = 3;
  let lastError: AtlasChatError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${ATLAS_CHAT_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          max_tokens: params.maxTokens ?? 1024,
          temperature: params.temperature ?? 0.4,
          stream: false
        })
      });

      let payload: AtlasChatCompletionResponse = {};
      try {
        payload = (await res.json()) as AtlasChatCompletionResponse;
      } catch {
        throw new AtlasChatError(`Atlas chat returned non-JSON (${res.status})`, res.status || 502);
      }

      if (!res.ok) {
        throw new AtlasChatError(
          extractErrorMessage(payload, `Atlas chat failed (${res.status})`),
          res.status
        );
      }

      const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) {
        throw new AtlasChatError("Atlas chat returned an empty response", 502);
      }

      return {
        content,
        model: payload.model?.trim() || model,
        usage: {
          promptTokens: payload.usage?.prompt_tokens ?? null,
          completionTokens: payload.usage?.completion_tokens ?? null,
          totalTokens: payload.usage?.total_tokens ?? null
        }
      };
    } catch (err) {
      lastError =
        err instanceof AtlasChatError
          ? err
          : new AtlasChatError(err instanceof Error ? err.message : "Atlas chat failed", 502);
      const retryable =
        lastError.statusCode === 429 ||
        lastError.statusCode >= 500 ||
        lastError.message.includes("empty response");
      if (!retryable || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError ?? new AtlasChatError("Atlas chat failed", 502);
}

export type AtlasChatStreamHandlers = {
  onDelta: (text: string) => void;
};

/** Streaming chat completion. Yields text deltas via onDelta; returns final content. */
export async function atlasChatCompletionStream(
  params: AtlasChatCompletionParams,
  handlers: AtlasChatStreamHandlers
): Promise<AtlasChatCompletionResult> {
  const apiKey = getAtlasApiKey();
  const model = params.model?.trim() || DEEPSEEK_V4_FLASH_MODEL;

  const res = await fetch(`${ATLAS_CHAT_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.4,
      stream: true
    })
  });

  if (!res.ok) {
    let payload: AtlasChatCompletionResponse = {};
    try {
      payload = (await res.json()) as AtlasChatCompletionResponse;
    } catch {
      /* ignore */
    }
    throw new AtlasChatError(
      extractErrorMessage(payload, `Atlas chat failed (${res.status})`),
      res.status
    );
  }

  if (!res.body) {
    throw new AtlasChatError("Atlas chat stream has no body", 502);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let resolvedModel = model;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          model?: string;
          choices?: Array<{ delta?: { content?: string | null } }>;
        };
        if (json.model?.trim()) resolvedModel = json.model.trim();
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          content += delta;
          handlers.onDelta(delta);
        }
      } catch {
        /* skip malformed chunk */
      }
    }
  }

  if (!content.trim()) {
    throw new AtlasChatError("Atlas chat returned an empty response", 502);
  }

  return {
    content,
    model: resolvedModel,
    usage: { promptTokens: null, completionTokens: null, totalTokens: null }
  };
}

