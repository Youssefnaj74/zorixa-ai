"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Mic, Play, Square, Video } from "lucide-react";

import { SelectedVoiceSummary } from "@/components/audio/SelectedVoiceSummary";
import { VoiceLibraryModal } from "@/components/audio/VoiceLibraryModal";
import { useVoicePreviewController } from "@/components/audio/VoiceCard";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { formatTtsCreditsEstimate } from "@/lib/tts/pricing";
import {
  MINIMAX_TTS_MODEL_ID,
  type TtsSpeechModelId
} from "@/lib/tts/providers/minimax/constants";
import { useCredits } from "@/lib/hooks/use-credits";
import { useClonedVoices } from "@/lib/hooks/use-cloned-voices";
import { useTtsVoices } from "@/lib/hooks/use-tts-voices";
import { TTS_MAX_CHARS, TTS_SPEED_DEFAULT } from "@/lib/tts/constants";
import { buildAudioToVideoWithAudioHref } from "@/lib/studio-catalog-link";
import { buildSameOriginAudioPlaybackUrl } from "@/lib/audio-playback-proxy";
import { audioDownloadFilename, downloadAudioFile } from "@/lib/download-audio-file";
import { sampleTextForVoice } from "@/lib/tts/voice-library/sample-text";
import { enrichVoiceMetadata, sortVoicesForLibrary } from "@/lib/tts/voice-library/metadata";
import { cn } from "@/lib/utils";

import { NAV_H } from "@/lib/nav-chrome";

type TtsHistoryEntry = {
  id: string;
  text: string;
  voiceName: string;
  audioUrl: string;
  createdAt: number;
};

export function TextToSpeechPage() {
  const searchParams = useSearchParams();
  const { refresh: refreshCredits, applyBalance } = useCredits();
  const { voices: clonedVoices } = useClonedVoices();
  const { voices: rawVoices, facets, warning, isLoading: loadingVoices } = useTtsVoices();

  const voices = useMemo(() => {
    const byId = new Map(rawVoices.map((v) => [v.voice_id, v]));

    for (const clone of clonedVoices) {
      const existing = byId.get(clone.voice_id);
      if (existing) {
        byId.set(clone.voice_id, {
          ...existing,
          name: clone.display_name,
          category: "cloned"
        });
      } else {
        byId.set(
          clone.voice_id,
          enrichVoiceMetadata({
            voice_id: clone.voice_id,
            name: clone.display_name,
            category: "cloned",
            labels: { accent: "custom" }
          })
        );
      }
    }

    return sortVoicesForLibrary([...byId.values()]);
  }, [rawVoices, clonedVoices]);
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [modelId, setModelId] = useState<TtsSpeechModelId>(MINIMAX_TTS_MODEL_ID);
  const [speed, setSpeed] = useState(TTS_SPEED_DEFAULT);
  const [voiceLibraryOpen, setVoiceLibraryOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<TtsHistoryEntry[]>([]);
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const applyVoiceSelection = useCallback((nextVoiceId: string) => {
    setVoiceId(nextVoiceId);
    setText((current) => (current.trim() ? current : sampleTextForVoice(nextVoiceId)));
  }, []);

  const {
    previewVoiceId,
    loadingVoiceId,
    togglePreview,
    stopPreview
  } = useVoicePreviewController(modelId, speed);

  useEffect(() => {
    stopPreview();
  }, [modelId, speed, stopPreview]);

  const playbackSrc = useMemo(() => {
    if (!audioUrl?.trim()) return null;
    if (typeof window === "undefined") return audioUrl;
    return buildSameOriginAudioPlaybackUrl(audioUrl, window.location.origin);
  }, [audioUrl]);

  useEffect(() => {
    if (!voiceId && voices.length > 0) {
      applyVoiceSelection(voices[0].voice_id);
    }
  }, [voiceId, voices, applyVoiceSelection]);

  useEffect(() => {
    const fromUrl = searchParams.get("voice_id")?.trim();
    if (fromUrl) applyVoiceSelection(fromUrl);
  }, [searchParams, applyVoiceSelection]);

  const selectedVoice = voices.find((v) => v.voice_id === voiceId);

  const ttsCreditsLine = useMemo(() => {
    return formatTtsCreditsEstimate(text.trim().length, modelId);
  }, [text, modelId]);

  const handleGenerate = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Enter text to speak.");
      return;
    }
    if (!voiceId) {
      setError("Select a voice.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: trimmed,
          voice_id: voiceId,
          model_id: modelId,
          speed
        })
      });
      const data = (await res.json()) as {
        audio_url?: string;
        error?: string;
        credits_balance?: number;
        credits_required?: number;
      };
      if (!res.ok) {
        if (res.status === 402 && data.error === "INSUFFICIENT_CREDITS") {
          if (typeof data.credits_balance === "number") applyBalance(data.credits_balance);
          throw new Error(
            `Not enough credits (need ${data.credits_required ?? "?"}, you have ${data.credits_balance ?? 0}).`
          );
        }
        throw new Error(data.error ?? "Generation failed");
      }
      if (!data.audio_url) {
        throw new Error("No audio returned");
      }

      if (typeof data.credits_balance === "number") {
        applyBalance(data.credits_balance);
      } else {
        void refreshCredits();
      }

      setAudioUrl(data.audio_url);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          text: trimmed,
          voiceName: selectedVoice?.name ?? "Voice",
          audioUrl: data.audio_url!,
          createdAt: Date.now()
        },
        ...prev.slice(0, 19)
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [applyBalance, text, voiceId, modelId, speed, selectedVoice?.name, refreshCredits]);

  useEffect(() => {
    setPlaying(false);
    setPlaybackError(null);
  }, [playbackSrc]);

  const togglePlay = useCallback(async () => {
    if (!playbackSrc) return;
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    setPlaybackError(null);
    try {
      if (el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("Could not load audio"));
          };
          const cleanup = () => {
            el.removeEventListener("canplay", onReady);
            el.removeEventListener("error", onError);
          };
          el.addEventListener("canplay", onReady, { once: true });
          el.addEventListener("error", onError, { once: true });
        });
      }
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setPlaybackError("Could not play audio. Try downloading the file or generate again.");
    }
  }, [playbackSrc, playing]);

  const handleDownload = useCallback(async () => {
    if (!audioUrl?.trim() || downloadBusy) return;
    setDownloadError(null);
    setDownloadBusy(true);
    try {
      await downloadAudioFile(audioUrl, audioDownloadFilename(audioUrl));
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadBusy(false);
    }
  }, [audioUrl, downloadBusy]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setPlaybackError("Could not load audio preview.");
    };
    el.addEventListener("ended", onEnded);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, [playbackSrc]);

  const charCount = text.length;
  const canGenerate = Boolean(text.trim() && voiceId);

  const useInVideoHref = audioUrl ? buildAudioToVideoWithAudioHref(audioUrl) : null;
  const previewRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [audioUrl]);

  const handleSelectedVoicePreview = useCallback(() => {
    if (!selectedVoice) return;
    void togglePreview(selectedVoice);
  }, [selectedVoice, togglePreview]);

  useEffect(() => {
    if (voiceLibraryOpen) stopPreview();
  }, [voiceLibraryOpen, stopPreview]);

  const previewSection =
    audioUrl ? (
      <section
        ref={previewRef}
        className="space-y-3 rounded-xl bg-zorixa-card/40 p-3.5 2xl:rounded-none 2xl:bg-transparent 2xl:p-0"
      >
        <h2 className="font-display text-xs font-semibold text-white/70">Preview</h2>
        <audio
          ref={audioRef}
          src={playbackSrc ?? undefined}
          controls
          preload="auto"
          className="h-9 w-full rounded-lg border border-white/[0.06] bg-black/20"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            onClick={togglePlay}
            className="h-8 rounded-lg bg-white/[0.04] px-2.5 text-xs text-white hover:bg-white/[0.07]"
          >
            {playing ? <Square className="mr-1 size-3" /> : <Play className="mr-1 size-3" />}
            {playing ? "Stop" : "Play"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleDownload()}
            disabled={downloadBusy}
            className="h-8 rounded-lg bg-white/[0.04] px-2.5 text-xs text-white hover:bg-white/[0.07] disabled:opacity-50"
          >
            <Download className="mr-1 size-3" />
            {downloadBusy ? "…" : "MP3"}
          </Button>
          {useInVideoHref ? (
            <Link
              href={useInVideoHref}
              className="inline-flex h-8 items-center rounded-lg bg-[#00e5ff]/10 px-2.5 text-xs font-semibold text-[#00e5ff] hover:bg-[#00e5ff]/15"
            >
              <Video className="mr-1 size-3" />
              Video
            </Link>
          ) : null}
        </div>
        {playbackError ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {playbackError}
          </p>
        ) : null}
        {downloadError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {downloadError}
          </p>
        ) : null}
      </section>
    ) : null;

  return (
    <div className="min-h-dvh bg-zorixa-bg font-body">
      <Navbar />
      <div
        className="mx-auto w-full max-w-[68rem] px-6 pb-12 pt-[calc(var(--nav-h,56px)+1.5rem)] 2xl:max-w-[90rem] 2xl:px-10"
        style={{ ["--nav-h" as string]: `${NAV_H}px` }}
      >
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3 2xl:mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#00e5ff]">
              <Mic className="size-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Speech Studio</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white 2xl:text-3xl">Text to Speech</h1>
          </div>
          <Link
            href="/audio/clones"
            className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white hover:bg-white/[0.07]"
          >
            Voice Clone
          </Link>
        </header>

        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-stretch 2xl:gap-10">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-zorixa-card/40 px-4 py-4 2xl:rounded-2xl 2xl:px-6 2xl:py-5">
            <div className="flex flex-col gap-3">
              <label htmlFor="tts-text" className="text-sm font-semibold text-white">
                Script
              </label>
              <textarea
                id="tts-text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, TTS_MAX_CHARS))}
                placeholder="Write what you want the voice to say…"
                rows={5}
                className="min-h-[9.5rem] w-full resize-y rounded-xl border border-white/[0.06] bg-zorixa-preview/80 px-4 py-3 text-[15px] leading-relaxed text-white placeholder:text-white/30 focus:border-[#8338eb]/40 focus:outline-none focus:ring-1 focus:ring-[#8338eb]/30 2xl:min-h-[calc(100dvh-var(--nav-h)-11rem)] 2xl:text-base"
              />
              <p className="text-right text-xs tabular-nums text-zorixa-muted">
                {charCount} / {TTS_MAX_CHARS}
              </p>
            </div>
          </section>

          <aside className="flex w-full flex-col gap-3 2xl:w-[22rem] 2xl:shrink-0 2xl:gap-4 2xl:rounded-2xl 2xl:bg-zorixa-card/30 2xl:px-5 2xl:py-5">
            {previewSection}

            <div className="rounded-xl bg-zorixa-card/30 px-4 py-3.5 2xl:rounded-none 2xl:bg-transparent 2xl:p-0">
              <SelectedVoiceSummary
                voice={selectedVoice}
                loading={loadingVoices}
                modelId={modelId}
                characterCount={text.trim().length}
                onModelChange={setModelId}
                speed={speed}
                onSpeedChange={setSpeed}
                creditsLine={ttsCreditsLine}
                previewing={selectedVoice ? previewVoiceId === selectedVoice.voice_id : false}
                previewLoading={selectedVoice ? loadingVoiceId === selectedVoice.voice_id : false}
                generating={generating}
                canGenerate={canGenerate}
                onChangeVoice={() => setVoiceLibraryOpen(true)}
                onPreview={selectedVoice ? handleSelectedVoicePreview : undefined}
                onGenerate={() => void handleGenerate()}
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}
          </aside>
        </div>

        {history.length > 0 ? (
          <section className="mt-8 space-y-3 2xl:mt-10">
            <h2 className="font-display text-sm font-semibold text-white">Recent</h2>
            <ul className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="zorixa-card-border rounded-xl bg-zorixa-card/80 px-3 py-2.5 sm:px-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{entry.text}</p>
                      <p className="mt-0.5 text-xs text-zorixa-muted">
                        {entry.voiceName} · {new Date(entry.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAudioUrl(entry.audioUrl);
                          setPlaying(false);
                          setPlaybackError(null);
                        }}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        Load
                      </button>
                      <Link
                        href={buildAudioToVideoWithAudioHref(entry.audioUrl)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#00e5ff] hover:bg-[#00e5ff]/10"
                      >
                        Video
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <VoiceLibraryModal
        open={voiceLibraryOpen}
        onClose={() => setVoiceLibraryOpen(false)}
        voices={voices}
        facets={facets}
        selectedVoiceId={voiceId}
        onSelectVoice={applyVoiceSelection}
        loading={loadingVoices}
        warning={warning}
      />
    </div>
  );
}
