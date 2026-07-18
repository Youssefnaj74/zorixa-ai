"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clapperboard,
  Copy,
  GripHorizontal,
  Loader2,
  MessageCircle,
  Plus,
  SendHorizontal,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";

import { AssistantMarkdown } from "@/components/assistant/AssistantMarkdown";
import { StudioActionCard } from "@/components/assistant/StudioActionCard";
import {
  assistantEmptyHeadline,
  assistantPageLabel,
  assistantTitle,
  getAssistantStarterQuestions,
  resolveAssistantPageKey
} from "@/components/assistant/starter-questions";
import { useAssistantStudioSnapshot } from "@/lib/hooks/use-assistant-studio-snapshot";
import { useCredits } from "@/lib/hooks/use-credits";
import {
  buildStudioDeepLink,
  extractStudioAction,
  type ZorixaStudioAction
} from "@/lib/zorixa-assistant-studio-action";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  streaming?: boolean;
  studioAction?: ZorixaStudioAction | null;
};

type PanelPos = { x: number; y: number };

const STUDIO_INTRO_KEY = "zorixa-assistant-studio-intro-v1";
const PANEL_POS_KEY = "zorixa-assistant-panel-pos-v1";
const FAB_POS_KEY = "zorixa-assistant-fab-pos-v1";
const PANEL_W = 400;
const PANEL_H = 640;
const FAB_W = 148;
const FAB_H = 48;
const PANEL_MARGIN = 12;
/** Keep FAB clear of the studio Generate dock. */
const FAB_CLEAR_BOTTOM = 168;

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampPos(pos: PanelPos, width: number, height: number): PanelPos {
  if (typeof window === "undefined") return pos;
  const maxX = Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN);
  const maxY = Math.max(PANEL_MARGIN, window.innerHeight - height - PANEL_MARGIN);
  return {
    x: Math.min(maxX, Math.max(PANEL_MARGIN, pos.x)),
    y: Math.min(maxY, Math.max(PANEL_MARGIN, pos.y))
  };
}

function defaultFabPos(): PanelPos {
  if (typeof window === "undefined") return { x: 24, y: 200 };
  return clampPos(
    {
      x: window.innerWidth - FAB_W - 24,
      y: window.innerHeight - FAB_H - FAB_CLEAR_BOTTOM
    },
    FAB_W,
    FAB_H
  );
}

function defaultPanelPos(nearFab?: PanelPos | null): PanelPos {
  if (typeof window === "undefined") return { x: 24, y: 96 };
  const w = Math.min(PANEL_W, window.innerWidth - PANEL_MARGIN * 2);
  const h = Math.min(PANEL_H, window.innerHeight * 0.72);
  if (nearFab) {
    return clampPos(
      {
        x: nearFab.x + FAB_W - w,
        y: Math.max(PANEL_MARGIN, nearFab.y - h - 12)
      },
      w,
      h
    );
  }
  return clampPos(
    {
      x: window.innerWidth - w - 24,
      y: window.innerHeight - h - FAB_CLEAR_BOTTOM
    },
    w,
    h
  );
}

function readStoredPos(key: string): PanelPos | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PanelPos;
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredPos(key: string, pos: PanelPos) {
  try {
    window.localStorage.setItem(key, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

async function streamAssistantReply(input: {
  message: string;
  history: Array<{ role: ChatRole; content: string }>;
  context: Record<string, string | null>;
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<{ reply: string; error?: string }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.message,
      messages: input.history,
      context: input.context,
      stream: true
    }),
    signal: input.signal
  });

  if (!res.ok) {
    let error = "The assistant could not respond. Please try again.";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) error = data.error;
    } catch {
      /* ignore */
    }
    if (res.status === 401) {
      error = "Sign in to chat with ZorixaAI Assistant.";
    }
    return { reply: "", error };
  }

  if (!res.body) {
    return { reply: "", error: "The assistant could not respond. Please try again." };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamed = "";
  let finalReply: string | null = null;
  let error: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      try {
        const event = JSON.parse(raw) as {
          type?: string;
          text?: string;
          reply?: string;
          error?: string;
        };
        if (event.type === "delta" && typeof event.text === "string") {
          streamed += event.text;
          input.onDelta(event.text);
        } else if (event.type === "done" && typeof event.reply === "string") {
          finalReply = event.reply;
        } else if (event.type === "error" && typeof event.error === "string") {
          error = event.error;
        }
      } catch {
        /* skip */
      }
    }
  }

  if (error) return { reply: "", error };
  return { reply: finalReply ?? streamed };
}

export function ZorixaAssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const pageKey = resolveAssistantPageKey(pathname);
  const pageLabel = assistantPageLabel(pageKey);
  const title = assistantTitle(pageKey);
  const starters = getAssistantStarterQuestions(pageKey);
  const emptyHeadline = assistantEmptyHeadline(pageKey);
  const studio = useAssistantStudioSnapshot();
  const { credits } = useCredits();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** null until client mount — avoids SSR/client left/top hydration mismatch. */
  const [fabPos, setFabPos] = useState<PanelPos | null>(null);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);
  const [draggingPanel, setDraggingPanel] = useState(false);
  const [draggingFab, setDraggingFab] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevPageKeyRef = useRef(pageKey);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartClientRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const draggingPanelRef = useRef(false);
  const draggingFabRef = useRef(false);
  const panelPosRef = useRef<PanelPos>(defaultPanelPos());
  const fabPosRef = useRef<PanelPos>(defaultFabPos());
  if (panelPos) panelPosRef.current = panelPos;
  if (fabPos) fabPosRef.current = fabPos;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open]);

  // Restore FAB + panel positions only on the client (after hydration).
  useEffect(() => {
    const fab = clampPos(readStoredPos(FAB_POS_KEY) ?? defaultFabPos(), FAB_W, FAB_H);
    fabPosRef.current = fab;
    setFabPos(fab);
    const panel = clampPos(
      readStoredPos(PANEL_POS_KEY) ?? defaultPanelPos(fab),
      PANEL_W,
      PANEL_H * 0.72
    );
    panelPosRef.current = panel;
    setPanelPos(panel);
  }, []);

  // Keep FAB/panel on-screen when the viewport resizes.
  useEffect(() => {
    function onResize() {
      setFabPos((prev) => {
        if (!prev) return prev;
        const next = clampPos(prev, FAB_W, FAB_H);
        fabPosRef.current = next;
        return next;
      });
      setPanelPos((prev) => {
        if (!prev) return prev;
        const el = panelRef.current;
        const w = el?.offsetWidth ?? Math.min(PANEL_W, window.innerWidth - PANEL_MARGIN * 2);
        const h = el?.offsetHeight ?? Math.min(PANEL_H, window.innerHeight * 0.72);
        const next = clampPos(prev, w, h);
        panelPosRef.current = next;
        return next;
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // First visit to Video/Image Studio → gently open the assistant once.
  useEffect(() => {
    if (pageKey !== "video" && pageKey !== "image") return;
    try {
      if (window.localStorage.getItem(STUDIO_INTRO_KEY) === "1") return;
      window.localStorage.setItem(STUDIO_INTRO_KEY, "1");
      const t = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(t);
    } catch {
      /* ignore storage errors */
    }
  }, [pageKey]);

  // Clear empty chat when switching studios so starters refresh for the new page.
  useEffect(() => {
    if (prevPageKeyRef.current === pageKey) return;
    prevPageKeyRef.current = pageKey;
    if (messages.length === 0 && !busy) {
      setError(null);
    }
  }, [busy, messages.length, pageKey]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function buildContext() {
    return {
      page: studio.page || pageLabel,
      selectedModel: studio.selectedModel,
      selectedDuration: studio.selectedDuration,
      selectedQuality: studio.selectedQuality,
      selectedAspectRatio: studio.selectedAspectRatio,
      draftPrompt: studio.draftPrompt,
      actionTab: studio.actionTab,
      speedTier: studio.speedTier,
      soundtrackOn: studio.soundtrackOn,
      uiEstimatedCredits: studio.uiEstimatedCredits,
      backendCreditsRequired: studio.backendCreditsRequired,
      backendCreditsBalance: studio.backendCreditsBalance,
      lastGenerateError: studio.lastGenerateError
    };
  }

  function startNewChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setError(null);
    setBusy(false);
  }

  function onPanelDragDown(e: ReactPointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea")) return;
    if (!panelRef.current) return;

    didDragRef.current = false;
    draggingPanelRef.current = true;
    setDraggingPanel(true);
    dragOffsetRef.current = {
      x: e.clientX - panelPosRef.current.x,
      y: e.clientY - panelPosRef.current.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPanelDragMove(e: ReactPointerEvent<HTMLElement>) {
    if (!draggingPanelRef.current) return;
    didDragRef.current = true;
    const panel = panelRef.current;
    const w = panel?.offsetWidth ?? PANEL_W;
    const h = panel?.offsetHeight ?? PANEL_H * 0.72;
    const next = clampPos(
      {
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y
      },
      w,
      h
    );
    panelPosRef.current = next;
    setPanelPos(next);
  }

  function onPanelDragUp(e: ReactPointerEvent<HTMLElement>) {
    if (!draggingPanelRef.current) return;
    draggingPanelRef.current = false;
    setDraggingPanel(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (didDragRef.current) writeStoredPos(PANEL_POS_KEY, panelPosRef.current);
  }

  function onFabDragDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    didDragRef.current = false;
    draggingFabRef.current = true;
    setDraggingFab(true);
    dragStartClientRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = {
      x: e.clientX - fabPosRef.current.x,
      y: e.clientY - fabPosRef.current.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onFabDragMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingFabRef.current) return;
    const moved =
      Math.abs(e.clientX - dragStartClientRef.current.x) +
      Math.abs(e.clientY - dragStartClientRef.current.y);
    if (moved > 5) didDragRef.current = true;
    if (!didDragRef.current) return;
    const next = clampPos(
      {
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y
      },
      FAB_W,
      FAB_H
    );
    fabPosRef.current = next;
    setFabPos(next);
  }

  function onFabDragUp(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingFabRef.current) return;
    draggingFabRef.current = false;
    setDraggingFab(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (didDragRef.current) {
      writeStoredPos(FAB_POS_KEY, fabPosRef.current);
      return;
    }
    // Pure click → open chat panel near the icon (Image-style).
    setPanelPos(defaultPanelPos(fabPosRef.current));
    setOpen(true);
  }

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    setError(null);
    setInput("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true }
    ]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await streamAssistantReply({
        message: text,
        history,
        context: buildContext(),
        signal: controller.signal,
        onDelta: (delta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: `${m.content}${delta}` } : m
            )
          );
        }
      });

      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(result.error);
        return;
      }

      const parsed = extractStudioAction(result.reply);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: parsed.displayText || result.reply,
                streaming: false,
                studioAction: parsed.action
              }
            : m
        )
      );
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setError("The assistant could not respond. Please try again.");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function copyText(messageId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      window.setTimeout(() => setCopiedId((id) => (id === messageId ? null : id)), 1400);
    } catch {
      /* ignore */
    }
  }

  function improvePromptFromMessage(message: ChatMessage) {
    const prompt = message.studioAction?.prompt?.trim() || studio.draftPrompt?.trim() || "";
    const ask = prompt
      ? `Improve this prompt for ${pageLabel}:\n\n${prompt}`
      : "Improve my current prompt.";
    void sendMessage(ask);
  }

  return (
    <>
      <AnimatePresence>
        {open && panelPos ? (
          <motion.div
            key="assistant-panel"
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ left: panelPos.x, top: panelPos.y }}
            className={cn(
              "fixed z-[320] flex w-[min(100vw-1.5rem,400px)] flex-col overflow-hidden",
              "h-[min(72vh,640px)] rounded-2xl border border-[#8338eb]/30 bg-[#0d0d14]/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-[14px]",
              draggingPanel ? "cursor-grabbing select-none" : null
            )}
            role="dialog"
            aria-label={title}
          >
            <header
              onPointerDown={onPanelDragDown}
              onPointerMove={onPanelDragMove}
              onPointerUp={onPanelDragUp}
              onPointerCancel={onPanelDragUp}
              className={cn(
                "flex touch-none items-center justify-between gap-3 border-b border-white/10 px-3 py-3",
                draggingPanel ? "cursor-grabbing" : "cursor-grab"
              )}
              title="Drag to move"
            >
              <div className="flex min-w-0 items-center gap-2">
                <GripHorizontal className="size-4 shrink-0 text-white/30" aria-hidden />
                <span className="grid size-7 place-items-center rounded-lg bg-[#8338eb]/20 text-[#c4b5fd]">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-white">{title}</p>
                  <p className="truncate text-[11px] text-white/45">
                    {pageLabel}
                    {typeof credits === "number" ? ` · ${credits.toLocaleString()} credits` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="grid size-8 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="New chat"
                  title="New chat"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close assistant"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="studio-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="font-display text-sm font-medium text-white">{emptyHeadline}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Pick a suggestion or ask anything about models, prompts, and credits.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {starters.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={busy}
                        onClick={() => void sendMessage(s.message)}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-[12px] text-white/75 transition hover:border-[#8338eb]/40 hover:bg-[#8338eb]/10 hover:text-white"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "group relative max-w-[95%]",
                    message.role === "user" ? "ml-auto" : "mr-auto w-full"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-[#2563eb] text-white"
                        : "border border-white/10 bg-[#16161f] text-white/90"
                    )}
                  >
                    {message.role === "assistant" ? (
                      message.streaming && !message.content ? (
                        <span className="inline-flex items-center gap-2 text-white/55">
                          <Loader2 className="size-3.5 animate-spin" />
                          Thinking…
                        </span>
                      ) : (
                        <>
                          <AssistantMarkdown content={message.content} />
                          {message.studioAction ? (
                            <StudioActionCard action={message.studioAction} />
                          ) : null}
                        </>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
                  </div>

                  {message.role === "assistant" && message.content && !message.streaming ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            `${message.id}-copy`,
                            message.studioAction?.prompt || message.content
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#0d0d14] px-2 py-1 text-[11px] text-white/60 transition hover:border-white/20 hover:text-white"
                      >
                        {copiedId === `${message.id}-copy` ? (
                          <>
                            <Check className="size-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />{" "}
                            {message.studioAction?.prompt ? "Copy Prompt" : "Copy"}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => improvePromptFromMessage(message)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#0d0d14] px-2 py-1 text-[11px] text-white/60 transition hover:border-[#8338eb]/40 hover:text-white disabled:opacity-40"
                      >
                        <Wand2 className="size-3" /> Improve Prompt
                      </button>
                      {message.studioAction ? (
                        <button
                          type="button"
                          onClick={() => router.push(buildStudioDeepLink(message.studioAction!))}
                          className="inline-flex items-center gap-1 rounded-md border border-[#8338eb]/35 bg-[#8338eb]/15 px-2 py-1 text-[11px] text-[#c4b5fd] transition hover:bg-[#8338eb]/25"
                        >
                          <Clapperboard className="size-3" /> Use in{" "}
                          {message.studioAction.type === "image" ? "Image" : "Video"} Studio
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}

              {error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              ) : null}
            </div>

            <form
              className="border-t border-white/10 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 focus-within:border-[#8338eb]/45">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  rows={1}
                  placeholder={`Ask ${pageLabel}…`}
                  className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-white/35"
                  disabled={busy}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className={cn(
                    "mb-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-[#2563eb] text-white transition",
                    "hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
                  )}
                  aria-label="Send message"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
                </button>
              </div>
              <p className="mt-2 px-1 text-[10px] text-white/30">Powered by live ZorixaAI data</p>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Draggable FAB — mount only after client position is ready (no hydration mismatch). */}
      {!open && fabPos ? (
        <motion.button
          ref={fabRef}
          type="button"
          style={{ left: fabPos.x, top: fabPos.y }}
          onPointerDown={onFabDragDown}
          onPointerMove={onFabDragMove}
          onPointerUp={onFabDragUp}
          onPointerCancel={onFabDragUp}
          className={cn(
            "fixed z-[330] flex touch-none items-center gap-2 rounded-full border border-[#8338eb]/40",
            "bg-[#14141c]/95 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(131,56,235,0.35)] backdrop-blur-md",
            "hover:border-[#8338eb]/70 hover:bg-[#1a1a24]",
            draggingFab ? "cursor-grabbing" : "cursor-grab"
          )}
          whileHover={draggingFab ? undefined : { scale: 1.03 }}
          whileTap={draggingFab ? undefined : { scale: 0.97 }}
          aria-expanded={false}
          aria-label="Open assistant — drag to move"
          title="Drag to move · click to open"
        >
          <MessageCircle className="size-4 text-[#c4b5fd]" />
          <span className="font-display">Assistant</span>
          <span className="rounded-full bg-[#8338eb]/25 px-1.5 py-0.5 text-[10px] font-medium text-[#c4b5fd]">
            AI
          </span>
        </motion.button>
      ) : null}
    </>
  );
}
