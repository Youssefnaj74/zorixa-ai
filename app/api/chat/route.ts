import { NextResponse } from "next/server";

import {
  AtlasChatError,
  atlasChatCompletion,
  atlasChatCompletionStream,
  type AtlasChatMessage
} from "@/lib/atlas-chat";
import { enforceContentPolicy, requestIp } from "@/lib/content-moderation";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildAssistantGrounding,
  type ZorixaAssistantClientContext
} from "@/lib/zorixa-assistant-context";
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
import { resolveZorixaActor, unauthorizedApiResponse } from "@/lib/zorixa-mcp-auth";

export const maxDuration = 60;

const MAX_MESSAGE_LEN = 4000;
const MAX_HISTORY = 12;

type ChatHistoryItem = {
  role?: unknown;
  content?: unknown;
};

type ChatRequestBody = {
  message?: unknown;
  messages?: unknown;
  context?: unknown;
  stream?: unknown;
};

function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function parseClientContext(raw: unknown): ZorixaAssistantClientContext | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  return {
    page: typeof c.page === "string" ? c.page : null,
    selectedModel: typeof c.selectedModel === "string" ? c.selectedModel : null,
    selectedDuration: typeof c.selectedDuration === "string" ? c.selectedDuration : null,
    selectedQuality: typeof c.selectedQuality === "string" ? c.selectedQuality : null,
    selectedAspectRatio: typeof c.selectedAspectRatio === "string" ? c.selectedAspectRatio : null,
    draftPrompt: typeof c.draftPrompt === "string" ? c.draftPrompt : null
  };
}

function parseHistory(raw: unknown, latestMessage: string): AtlasChatMessage[] {
  const out: AtlasChatMessage[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw as ChatHistoryItem[]) {
      const role = item?.role === "assistant" || item?.role === "user" ? item.role : null;
      const content = cleanText(item?.content, MAX_MESSAGE_LEN);
      if (!role || !content) continue;
      out.push({ role, content });
    }
  }

  const trimmed = out.slice(-MAX_HISTORY);
  const last = trimmed[trimmed.length - 1];
  if (!last || last.role !== "user" || last.content !== latestMessage) {
    trimmed.push({ role: "user", content: latestMessage });
  }
  return trimmed.slice(-MAX_HISTORY);
}

function sseEncode(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

/**
 * ZorixaAI Assistant — Cursor (Next.js) is the intermediary.
 * POST /api/chat  { message, messages?, context?, stream? }
 */
export async function POST(request: Request) {
  const ip = requestIp(request);
  const rl = rateLimit({ key: `chat:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const actor = await resolveZorixaActor(request);
  if (!actor) return unauthorizedApiResponse();

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = cleanText(body.message, MAX_MESSAGE_LEN);
  if (!message || message.length < 1) {
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  }

  const wantStream = body.stream === true;

  const policyBlock = await enforceContentPolicy({
    userId: actor.userId,
    workflow: "assistant_chat",
    route: "/api/chat",
    texts: [message],
    ip,
    metadata: { via: actor.via }
  });
  if (policyBlock) return policyBlock;

  const clientContext = parseClientContext(body.context);
  const grounding = await buildAssistantGrounding({
    userId: actor.userId,
    client: clientContext
  });

  const contextPayload = {
    user: grounding.user,
    page: grounding.client.page,
    selectedModel: grounding.client.selectedModel,
    selectedModelLabel: grounding.client.selectedModelLabel,
    selectedDuration: grounding.client.selectedDuration,
    selectedQuality: grounding.client.selectedQuality,
    selectedAspectRatio: grounding.client.selectedAspectRatio,
    modelsCount: grounding.models.length
  };

  if (isLikelyOffTopicAssistantQuery(message)) {
    if (wantStream) {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              sseEncode({
                type: "done",
                reply: ASSISTANT_OFF_TOPIC_REPLY,
                model: "zorixa-assistant-guard",
                guarded: true,
                guardReason: "off_topic",
                context: contextPayload
              })
            )
          );
          controller.close();
        }
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive"
        }
      });
    }
    return NextResponse.json({
      reply: ASSISTANT_OFF_TOPIC_REPLY,
      model: "zorixa-assistant-guard",
      usage: { promptTokens: null, completionTokens: null, totalTokens: null },
      context: contextPayload,
      guarded: true,
      guardReason: "off_topic"
    });
  }

  const systemPrompt = buildZorixaAssistantSystemPrompt(grounding);
  const history = parseHistory(body.messages, message);
  const facts = buildGroundingFacts({
    models: grounding.models,
    packs: grounding.pricing.packs,
    pricingModels: grounding.pricing.models,
    userCredits: grounding.user?.credits ?? null
  });
  const llmMessages: AtlasChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history
  ];

  if (wantStream) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(sseEncode(payload)));
        };
        try {
          const completion = await atlasChatCompletionStream(
            { messages: llmMessages, maxTokens: 1024, temperature: 0.2 },
            {
              onDelta: (text) => send({ type: "delta", text })
            }
          );

          let guarded = guardAssistantReply(completion.content, facts);

          if (
            isUnexpectedAssistantRefusal({
              userMessage: message,
              reply: guarded.reply
            })
          ) {
            send({ type: "status", text: "refining" });
            const retry = await atlasChatCompletion({
              messages: [
                { role: "system", content: `${systemPrompt}${ASSISTANT_REFUSAL_RETRY_SUFFIX}` },
                ...history
              ],
              maxTokens: 1024,
              temperature: 0
            });
            guarded = guardAssistantReply(retry.content, facts);
          }

          send({
            type: "done",
            reply: guarded.reply,
            model: completion.model,
            guarded: guarded.guarded,
            guardReason: guarded.reason,
            context: contextPayload
          });
          controller.close();
        } catch (err) {
          const msg =
            err instanceof AtlasChatError
              ? err.message.includes("ATLASCLOUD_API_KEY")
                ? "Chat is temporarily unavailable."
                : "The assistant could not respond. Please try again."
              : "The assistant could not respond. Please try again.";
          send({ type: "error", error: msg });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  }

  try {
    const completion = await atlasChatCompletion({
      messages: llmMessages,
      maxTokens: 1024,
      temperature: 0.2
    });

    let guarded = guardAssistantReply(completion.content, facts);

    if (
      isUnexpectedAssistantRefusal({
        userMessage: message,
        reply: guarded.reply
      })
    ) {
      const retry = await atlasChatCompletion({
        messages: [
          { role: "system", content: `${systemPrompt}${ASSISTANT_REFUSAL_RETRY_SUFFIX}` },
          ...history
        ],
        maxTokens: 1024,
        temperature: 0
      });
      guarded = guardAssistantReply(retry.content, facts);
    }

    return NextResponse.json({
      reply: guarded.reply,
      model: completion.model,
      usage: completion.usage,
      context: contextPayload,
      guarded: guarded.guarded,
      guardReason: guarded.reason
    });
  } catch (err) {
    if (err instanceof AtlasChatError) {
      console.error("[api/chat] AtlasChatError", err.statusCode, err.message);
      const status = err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502;
      return NextResponse.json(
        {
          error:
            err.statusCode === 500 && err.message.includes("ATLASCLOUD_API_KEY")
              ? "Chat is temporarily unavailable."
              : "The assistant could not respond. Please try again."
        },
        { status: status === 401 || status === 403 ? 502 : status }
      );
    }
    console.error("[api/chat]", err);
    return NextResponse.json({ error: "The assistant could not respond. Please try again." }, { status: 502 });
  }
}
