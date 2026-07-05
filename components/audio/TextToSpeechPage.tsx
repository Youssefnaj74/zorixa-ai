"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Mic, Play, Square, Video } from "lucide-react";

import { SelectedVoiceSummary } from "@/components/audio/SelectedVoiceSummary";
import { VoiceLibraryModal } from "@/components/audio/VoiceLibraryModal";
import { useVoicePreviewController } from "@/components/audio/VoiceCard";
import { useComposerActionsPin } from "@/components/audio/useComposerActionsPin";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { formatGenerationCreditsLine } from "@/lib/atlas-pricing-catalog";
import { useTtsVoices } from "@/lib/hooks/use-tts-voices";
import { creditsChargedForTts } from "@/lib/tts/pricing";
import { MINIMAX_TTS_MODEL_ID } from "@/lib/tts/providers/minimax/constants";
import { useCredits } from "@/lib/hooks/use-credits";
import { TTS_MAX_CHARS } from "@/lib/tts/constants";
import { buildAudioToVideoWithAudioHref } from "@/lib/studio-catalog-link";
import { buildSameOriginAudioPlaybackUrl } from "@/lib/audio-playback-proxy";
import { audioDownloadFilename, downloadAudioFile } from "@/lib/download-audio-file";
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
  const { refresh: refreshCredits } = useCredits();
  const { voices, facets, warning, isLoading: loadingVoices } = useTtsVoices();
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
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
  const scriptAreaRef = useRef<HTMLDivElement | null>(null);
  const pinComposerActions = useComposerActionsPin(scriptAreaRef);

  const {
    previewVoiceId,
    loadingVoiceId,
    togglePreview,
    stopPreview
  } = useVoicePreviewController();

  const playbackSrc = useMemo(() => {
    if (!audioUrl?.trim()) return null;
    if (typeof window === "undefined") return audioUrl;
    return buildSameOriginAudioPlaybackUrl(audioUrl, window.location.origin);
  }, [audioUrl]);

  useEffect(() => {
    if (!voiceId && voices.length > 0) {
      setVoiceId(voices[0].voice_id);
    }
  }, [voiceId, voices]);

  const selectedVoice = voices.find((v) => v.voice_id === voiceId);

  const ttsCreditsLine = useMemo(() => {
    const chars = text.trim().length;
    if (chars === 0) return "Credits scale with text length";
    return formatGenerationCreditsLine(
      creditsChargedForTts({ characterCount: chars, modelId: MINIMAX_TTS_MODEL_ID })
    );
  }, [text]);

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
        body: JSON.stringify({ text: trimmed, voice_id: voiceId })
      });
      const data = (await res.json()) as {
        audio_url?: string;
        error?: string;
        credits_balance?: number;
        credits_required?: number;
      };
      if (!res.ok) {
        if (res.status === 402 && data.error === "INSUFFICIENT_CREDITS") {
          throw new Error(
            `Not enough credits (need ${data.credits_required ?? "?"}, you have ${data.credits_balance ?? 0}).`
          );
        }
        throw new Error(data.error ?? "Generation failed");
      }
      if (!data.audio_url) {
        throw new Error("No audio returned");
      }

      void refreshCredits();

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
  }, [text, voiceId, selectedVoice?.name, refreshCredits]);

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
        className="zorixa-card-border space-y-4 rounded-2xl border-[#00e5ff]/20 bg-zorixa-card p-4 shadow-glow sm:p-5"
      >
        <h2 className="font-display text-sm font-semibold text-white">Preview</h2>
        <audio
          ref={audioRef}
          src={playbackSrc ?? undefined}
          controls
          preload="auto"
          className="w-full rounded-xl border border-white/10 bg-black/20"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={togglePlay}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-white hover:bg-white/10"
          >
            {playing ? <Square className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
            {playing ? "Stop" : "Play"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleDownload()}
            disabled={downloadBusy}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <Download className="mr-2 size-4" />
            {downloadBusy ? "Downloading…" : "Download MP3"}
          </Button>
          {useInVideoHref ? (
            <Link
              href={useInVideoHref}
              className="inline-flex h-10 items-center rounded-xl border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-4 text-sm font-semibold text-[#00e5ff] hover:bg-[#00e5ff]/20"
            >
              <Video className="mr-2 size-4" />
              Use in Video
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
        className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-8 pt-[calc(var(--nav-h,56px)+1rem)] lg:px-6"
        style={{ ["--nav-h" as string]: `${NAV_H}px` }}
      >
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-[#00e5ff]">
            <Mic className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Voice</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Text to Speech</h1>
          <p className="text-sm text-zorixa-muted">
            Write your script, pick a voice, and generate natural speech in seconds.
          </p>
        </header>

        <section className="zorixa-card-border flex flex-col overflow-hidden rounded-2xl bg-zorixa-card shadow-glow">
          <div ref={scriptAreaRef} className="space-y-3 p-4 sm:p-5">
            <label htmlFor="tts-text" className="text-sm font-semibold text-white">
              Script
            </label>
            <textarea
              id="tts-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, TTS_MAX_CHARS))}
              placeholder="Write what you want the voice to say…"
              rows={7}
              className="min-h-[168px] w-full resize-y rounded-xl border border-white/10 bg-zorixa-preview px-3 py-3 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-[#8338eb]/50 focus:outline-none focus:ring-1 focus:ring-[#8338eb]/40"
            />
            <p className="text-right text-xs tabular-nums text-zorixa-muted">
              {charCount} / {TTS_MAX_CHARS}
            </p>
          </div>

          <div
            className={cn(
              "space-y-3 border-t border-white/10 bg-zorixa-card p-4 sm:p-5",
              pinComposerActions &&
                "sticky bottom-0 z-10 border-t-white/15 bg-zorixa-card/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md"
            )}
          >
            <SelectedVoiceSummary
              voice={selectedVoice}
              loading={loadingVoices}
              previewing={selectedVoice ? previewVoiceId === selectedVoice.voice_id : false}
              previewLoading={selectedVoice ? loadingVoiceId === selectedVoice.voice_id : false}
              onChangeVoice={() => setVoiceLibraryOpen(true)}
              onPreview={selectedVoice ? handleSelectedVoicePreview : undefined}
            />

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating || !text.trim() || !voiceId}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#8338eb] to-[#00e5ff] font-semibold text-black hover:opacity-90 disabled:opacity-40"
            >
              {generating ? "Generating…" : "Generate speech"}
            </Button>
            <p className="text-center text-xs tabular-nums text-zorixa-muted">{ttsCreditsLine}</p>
          </div>
        </section>

        {previewSection}

        {history.length > 0 ? (
          <section className="space-y-3">
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
        onSelectVoice={setVoiceId}
        loading={loadingVoices}
        warning={warning}
      />
    </div>
  );
}
