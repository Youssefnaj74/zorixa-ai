"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Mic2,
  Pencil,
  Play,
  Square,
  Trash2,
  Upload
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useClonedVoices } from "@/lib/hooks/use-cloned-voices";
import { useCredits } from "@/lib/hooks/use-credits";
import {
  TTS_CLONE_ACCEPTED_EXTENSIONS,
  TTS_CLONE_MAX_BYTES,
  TTS_CLONE_MAX_DURATION_SEC,
  TTS_CLONE_MIN_DURATION_SEC,
  isTtsCloneAudioExtension
} from "@/lib/tts/constants";
import { creditsChargedForVoiceClone, formatVoiceCloneCreditsLine } from "@/lib/tts/pricing";
import { formatInteger } from "@/lib/format-number";
import type { UserClonedVoice } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { NAV_H } from "@/lib/nav-chrome";

type ClonePhase = "idle" | "validating" | "cloning" | "done" | "error";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

async function measureAudioDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          reject(new Error("Could not read audio duration"));
          return;
        }
        resolve(audio.duration);
      };
      audio.onerror = () => reject(new Error("Could not read audio file"));
      audio.src = url;
    });
    return duration;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function MyVoiceRow({
  voice,
  onRenamed,
  onDeleted
}: {
  voice: UserClonedVoice;
  onRenamed: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(voice.display_name);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoBlobRef = useRef<string | null>(null);

  const stopDemo = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (demoBlobRef.current) {
      URL.revokeObjectURL(demoBlobRef.current);
      demoBlobRef.current = null;
    }
    setPlaying(false);
    setDemoLoading(false);
  }, []);

  useEffect(() => () => stopDemo(), [stopDemo]);

  const saveRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === voice.display_name) {
      setEditing(false);
      setName(voice.display_name);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/tts/cloned-voices/${encodeURIComponent(voice.voice_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ display_name: trimmed })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Rename failed");
      setEditing(false);
      onRenamed();
    } catch {
      setName(voice.display_name);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${voice.display_name}" from your library?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tts/cloned-voices/${encodeURIComponent(voice.voice_id)}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      onDeleted();
    } finally {
      setBusy(false);
    }
  };

  const toggleDemo = async () => {
    if (!voice.demo_audio_url) return;
    if (playing) {
      stopDemo();
      return;
    }

    setDemoLoading(true);
    try {
      const res = await fetch(`/api/tts/cloned-voices/${encodeURIComponent(voice.voice_id)}/demo`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Demo unavailable");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      demoBlobRef.current = blobUrl;

      const el = new Audio(blobUrl);
      audioRef.current = el;
      el.onended = () => stopDemo();
      el.onerror = () => stopDemo();
      await el.play();
      setPlaying(true);
    } catch {
      stopDemo();
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <li className="rounded-xl bg-zorixa-card/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveRename();
                if (e.key === "Escape") {
                  setEditing(false);
                  setName(voice.display_name);
                }
              }}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#8338eb]/40"
              autoFocus
            />
          ) : (
            <p className="truncate font-display text-sm font-semibold text-white">{voice.display_name}</p>
          )}
          <p className="mt-0.5 truncate text-xs text-zorixa-muted">{voice.voice_id}</p>
          <p className="mt-1 text-[11px] text-zorixa-muted">
            {new Date(voice.created_at).toLocaleDateString()}
            {voice.activated_at ? " · Activated" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {voice.demo_audio_url ? (
            <Button
              type="button"
              variant="ghost"
              disabled={demoLoading}
              onClick={() => void toggleDemo()}
              className="h-8 rounded-lg bg-white/[0.04] px-2.5 text-xs text-white hover:bg-white/[0.07]"
            >
              {demoLoading ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : playing ? (
                <Square className="mr-1 size-3" />
              ) : (
                <Play className="mr-1 size-3" />
              )}
              Demo
            </Button>
          ) : null}
          <Link
            href={`/audio?voice_id=${encodeURIComponent(voice.voice_id)}`}
            className="inline-flex h-8 items-center rounded-lg bg-[#00e5ff]/10 px-2.5 text-xs font-semibold text-[#00e5ff] hover:bg-[#00e5ff]/15"
          >
            Use in TTS
          </Link>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void saveRename()}
              className="h-8 rounded-lg px-2.5 text-xs text-white"
            >
              Save
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setEditing(true)}
              className="h-8 rounded-lg bg-white/[0.04] px-2.5 text-xs text-white hover:bg-white/[0.07]"
            >
              <Pencil className="size-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void remove()}
            className="h-8 rounded-lg bg-red-500/10 px-2.5 text-xs text-red-200 hover:bg-red-500/15"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export function VoiceCloneStudioPage() {
  const {
    credits,
    isLoading: creditsLoading,
    refresh: refreshCredits,
    applyBalance
  } = useCredits();
  const { voices, isLoading, refresh } = useClonedVoices();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cloneCost = useMemo(() => creditsChargedForVoiceClone(), []);
  const cloneCostLine = useMemo(() => formatVoiceCloneCreditsLine(), []);
  const hasEnoughCredits = credits >= cloneCost;

  const [file, setFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<ClonePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const accept = TTS_CLONE_ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",");

  const stopPreview = useCallback(() => {
    previewAudioRef.current?.pause();
    setPreviewPlaying(false);
  }, []);

  const resetFile = () => {
    stopPreview();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    previewAudioRef.current = null;
    setFile(null);
    setDurationSec(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickFile = async (next: File) => {
    setError(null);
    setPhase("validating");
    const ext = next.name.split(".").pop()?.toLowerCase() ?? "";
    if (!isTtsCloneAudioExtension(ext)) {
      setError("Use MP3, M4A, or WAV (10s – 5min).");
      setPhase("error");
      return;
    }
    if (next.size > TTS_CLONE_MAX_BYTES) {
      setError("File must be under 20 MB.");
      setPhase("error");
      return;
    }
    try {
      const duration = await measureAudioDuration(next);
      if (duration < TTS_CLONE_MIN_DURATION_SEC || duration > TTS_CLONE_MAX_DURATION_SEC) {
        setError(
          `Audio must be ${TTS_CLONE_MIN_DURATION_SEC}s – ${TTS_CLONE_MAX_DURATION_SEC / 60} minutes (got ${formatDuration(duration)}).`
        );
        setPhase("error");
        return;
      }
      setFile(next);
      setDurationSec(duration);
      stopPreview();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(next);
      previewAudioRef.current = null;
      if (!name.trim()) {
        const base = next.name.replace(/\.[^.]+$/, "").slice(0, 40);
        setName(base || "My Voice");
      }
      setPhase("idle");
    } catch {
      setError("Could not read this audio file.");
      setPhase("error");
    }
  };

  const handleClone = useCallback(async () => {
    if (!file || durationSec == null) return;
    const displayName = name.trim();
    if (!displayName) {
      setError("Enter a name for your voice.");
      return;
    }

    setPhase("cloning");
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("name", displayName);
    form.append("duration_sec", String(durationSec));

    try {
      const res = await fetch("/api/tts/clone", {
        method: "POST",
        credentials: "include",
        body: form
      });
      const data = (await res.json()) as {
        error?: string;
        voice?: UserClonedVoice;
        credits_balance?: number;
        credits_required?: number;
      };
      if (!res.ok) {
        if (res.status === 402) {
          if (typeof data.credits_balance === "number") applyBalance(data.credits_balance);
          throw new Error(
            `Not enough credits (need ${data.credits_required ?? cloneCost}, you have ${data.credits_balance ?? credits}).`
          );
        }
        throw new Error(data.error ?? "Clone failed");
      }
      setPhase("done");
      resetFile();
      setName("");
      void refresh();
      if (typeof data.credits_balance === "number") {
        applyBalance(data.credits_balance);
      } else {
        void refreshCredits();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clone failed");
      setPhase("error");
    }
  }, [applyBalance, file, durationSec, name, refresh, refreshCredits, stopPreview, cloneCost, credits]);

  const togglePreview = () => {
    if (!previewUrlRef.current) return;
    if (previewPlaying) {
      stopPreview();
      return;
    }
    const el = previewAudioRef.current ?? new Audio(previewUrlRef.current);
    previewAudioRef.current = el;
    el.onended = () => setPreviewPlaying(false);
    el.onerror = () => stopPreview();
    void el.play().catch(() => stopPreview());
    setPreviewPlaying(true);
  };

  const cloning = phase === "cloning" || phase === "validating";

  return (
    <div className="min-h-dvh bg-zorixa-bg font-body">
      <Navbar />
      <div
        className="mx-auto w-full max-w-3xl px-6 pb-12 pt-[calc(var(--nav-h,56px)+1.5rem)]"
        style={{ ["--nav-h" as string]: `${NAV_H}px` }}
      >
        <div className="mb-6">
          <Link
            href="/audio"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-zorixa-muted hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Text to Speech
          </Link>
          <div className="flex items-center gap-2 text-[#00e5ff]">
            <Mic2 className="size-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Voice Clone</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Clone your voice</h1>
          <p className="mt-1 text-sm text-zorixa-muted">
            Upload 10 seconds to 5 minutes of clear speech.
          </p>
        </div>

        <section className="mb-8 rounded-2xl bg-zorixa-card/40 p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickFile(f);
            }}
          />

          <button
            type="button"
            disabled={cloning}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void pickFile(f);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center transition-colors",
              dragOver
                ? "border-[#00e5ff]/40 bg-[#00e5ff]/5"
                : "border-white/10 bg-black/20 hover:border-white/20",
              cloning && "pointer-events-none opacity-60"
            )}
          >
            <Upload className="mb-3 size-8 text-white/40" />
            {file ? (
              <>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="mt-1 text-xs text-zorixa-muted">
                  {formatDuration(durationSec ?? 0)} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
                <p className="mt-2 text-xs text-[#00e5ff]">Click to replace</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">Upload audio</p>
                <p className="mt-1 text-xs text-zorixa-muted">MP3, M4A, or WAV · drag and drop</p>
              </>
            )}
          </button>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-white/70" htmlFor="clone-name">
              Voice name
            </label>
            <input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder="My Podcast Voice"
              className="w-full rounded-xl border border-white/[0.06] bg-zorixa-preview/80 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#8338eb]/40 focus:outline-none"
            />
          </div>

          {file ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={cloning}
                onClick={togglePreview}
                className="h-9 rounded-lg bg-white/[0.04] px-3 text-xs text-white hover:bg-white/[0.07]"
              >
                {previewPlaying ? <Square className="mr-1.5 size-3.5" /> : <Play className="mr-1.5 size-3.5" />}
                {previewPlaying ? "Stop" : "Listen to upload"}
              </Button>
              <p className="text-xs text-zorixa-muted">Check clarity before cloning</p>
            </div>
          ) : null}

          {phase === "cloning" ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 text-sm text-white/80">
              <Loader2 className="size-4 animate-spin text-[#00e5ff]" />
              Uploading to MiniMax and cloning your voice…
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {phase === "done" ? (
            <p className="mt-4 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2 text-sm text-[#00e5ff]">
              Voice cloned successfully. Use it in Text to Speech below.
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm">
            <span className="text-zorixa-muted">Voice clone</span>
            <span className="font-semibold tabular-nums text-[#00e5ff]/90">{cloneCostLine}</span>
          </div>

          {!creditsLoading && !hasEnoughCredits ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Not enough credits — you need {formatInteger(cloneCost)} but have {formatInteger(credits)}.{" "}
              <Link href="/pricing" className="font-semibold text-[#00e5ff] hover:underline">
                View Plans
              </Link>
            </p>
          ) : null}

          <Button
            type="button"
            disabled={!file || cloning || !name.trim() || !hasEnoughCredits}
            onClick={() => void handleClone()}
            className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-[#8338eb] to-[#00e5ff] text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40"
          >
            {cloning ? "Generating…" : "Generate voice"}
          </Button>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-sm font-semibold text-white">My voices</h2>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-zorixa-muted">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : voices.length === 0 ? (
            <div className="rounded-xl bg-zorixa-card/30 px-4 py-6 text-center text-sm text-zorixa-muted">
              <p>No cloned voices yet.</p>
              <p className="mt-2 text-xs leading-relaxed">
                After you clone, your voices appear here with <span className="text-white/80">Demo</span> (AI
                preview), <span className="text-[#00e5ff]">Use in TTS</span> (generate speech), rename, and delete.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {voices.map((voice) => (
                <MyVoiceRow
                  key={voice.id}
                  voice={voice}
                  onRenamed={() => void refresh()}
                  onDeleted={() => void refresh()}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
