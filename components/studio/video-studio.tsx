"use client";

import { useCallback, useRef, useState } from "react";
import {
  Clapperboard,
  Download,
  Film,
  ImagePlus,
  Loader2,
  Sparkles,
  Video,
  X
} from "lucide-react";

import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import { pollVideoJob, uploadFileToApi } from "@/components/studio/batch-jobs";
import { StudioShell } from "@/components/studio/studio-shell";
import {
  studioField,
  studioOptionActive,
  studioOptionIdle,
  studioSection
} from "@/components/studio/studio-styles";
import {
  ASPECT_OPTIONS,
  VIDEO_MODELS,
  type AspectRatioId,
  type VideoModelId
} from "@/lib/studio-constants";
import { CREDIT_COSTS } from "@/lib/replicate";
import { cn } from "@/lib/utils";

type FrameState = {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
};

const emptyFrame = (): FrameState => ({ file: null, previewUrl: null, uploadedUrl: null });

export function VideoStudio() {
  const startFileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);
  const [startFileInputKey, setStartFileInputKey] = useState(0);
  const [endFileInputKey, setEndFileInputKey] = useState(0);

  const [startFrame, setStartFrame] = useState<FrameState>(emptyFrame);
  const [endFrame, setEndFrame] = useState<FrameState>(emptyFrame);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("9:16");
  const [videoModelId, setVideoModelId] = useState<VideoModelId>("default");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "starting" | "processing">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const videoCost = CREDIT_COSTS.video;

  const setFrame = useCallback(
    (which: "start" | "end", file: File | null) => {
      const set = which === "start" ? setStartFrame : setEndFrame;
      set((prev) => {
        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        if (!file) return emptyFrame();
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          uploadedUrl: null
        };
      });
      setResult(null);
      setError(null);
    },
    []
  );

  const resetStartFileInput = useCallback(() => {
    if (startFileInputRef.current) startFileInputRef.current.value = "";
    setStartFileInputKey((k) => k + 1);
  }, []);

  const resetEndFileInput = useCallback(() => {
    if (endFileInputRef.current) endFileInputRef.current.value = "";
    setEndFileInputKey((k) => k + 1);
  }, []);

  const clearStartFrame = useCallback(() => {
    setFrame("start", null);
    resetStartFileInput();
  }, [setFrame, resetStartFileInput]);

  const clearEndFrame = useCallback(() => {
    setFrame("end", null);
    resetEndFileInput();
  }, [setFrame, resetEndFileInput]);

  function handleStartFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) setFrame("start", file);
    e.target.value = "";
  }

  function handleEndFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) setFrame("end", file);
    e.target.value = "";
  }

  async function pollGeneration(id: string) {
    setStatus("processing");
    const out = await pollVideoJob(id);
    return out;
  }

  async function run() {
    if (!startFrame.file || !endFrame.file) {
      setError("Add both a start image and an end image.");
      return;
    }
    if (!prompt.trim()) {
      setError("Add a prompt describing the video.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setStatus("uploading");
      let startUrl = startFrame.uploadedUrl;
      if (!startUrl) {
        startUrl = await uploadFileToApi(startFrame.file);
        setStartFrame((s) => ({ ...s, uploadedUrl: startUrl }));
      }

      let endUrl = endFrame.uploadedUrl;
      if (!endUrl) {
        endUrl = await uploadFileToApi(endFrame.file);
        setEndFrame((e) => ({ ...e, uploadedUrl: endUrl }));
      }

      setStatus("starting");
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input_url: startUrl,
          end_image_url: endUrl,
          description: prompt.trim(),
          negative_prompt: negativePrompt.trim() || undefined,
          aspect_ratio: aspectRatio,
          model_id: videoModelId,
          voice_style: "friendly"
        })
      });

      const data = (await res.json()) as {
        id?: string;
        status?: string;
        output_url?: string;
        error?: string;
      };

      if (res.status === 402 && data.error === "INSUFFICIENT_CREDITS") {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed");

      if (data.status === "completed") {
        setResult(data.output_url ?? null);
        setStatus("idle");
      } else if (data.id) {
        const out = await pollGeneration(data.id);
        setResult(out);
        setStatus("idle");
      } else {
        throw new Error("Invalid response");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }

  const hasBothImages = Boolean(startFrame.file && endFrame.file);
  const running = loading || status === "uploading" || status === "starting" || status === "processing";
  const canRun = hasBothImages && Boolean(prompt.trim()) && !running;

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <StudioShell
        title="Video studio"
        subtitle="Set a start and end keyframe, then describe the motion between them."
        badge="Motion"
        left={
          <>
            <div>
              <p className={studioSection}>Frames</p>
              <p className="mt-1 font-body text-xs text-white/50">Exactly two images — the generate button enables when both are set.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-center font-heading text-xs font-medium text-white/50">Start image</p>
                  <label
                    className={cn(
                      "flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-studio-line bg-black/30 p-2 transition-colors hover:border-white/12"
                    )}
                  >
                    <input
                      key={`video-start-file-${startFileInputKey}`}
                      ref={startFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleStartFileChange}
                    />
                    {startFrame.previewUrl ? (
                      <div className="relative size-full min-h-[100px]">
                        <img
                          src={startFrame.previewUrl}
                          alt="Start"
                          className="size-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            clearStartFrame();
                          }}
                          className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-black/70 text-white hover:bg-red-500/90"
                          aria-label="Remove start image"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="size-7 text-white/40" strokeWidth={1.25} />
                        <span className="mt-2 text-center font-body text-[11px] text-white/50">Upload</span>
                      </>
                    )}
                  </label>
                </div>
                <div>
                  <p className="mb-1.5 text-center font-heading text-xs font-medium text-white/50">End image</p>
                  <label
                    className={cn(
                      "flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-studio-line bg-black/30 p-2 transition-colors hover:border-white/12"
                    )}
                  >
                    <input
                      key={`video-end-file-${endFileInputKey}`}
                      ref={endFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEndFileChange}
                    />
                    {endFrame.previewUrl ? (
                      <div className="relative size-full min-h-[100px]">
                        <img
                          src={endFrame.previewUrl}
                          alt="End"
                          className="size-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            clearEndFrame();
                          }}
                          className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-black/70 text-white hover:bg-red-500/90"
                          aria-label="Remove end image"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="size-7 text-white/40" strokeWidth={1.25} />
                        <span className="mt-2 text-center font-body text-[11px] text-white/50">Upload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <p className={studioSection}>Prompt</p>
              <textarea
                className={cn(studioField(), "mt-3 min-h-[120px] resize-y")}
                placeholder="Describe motion, pacing, lighting, or narration…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <p className={studioSection}>Aspect ratio</p>
              <p className="mt-1 font-body text-xs text-white/50">Hints for width/height sent to your video model.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ASPECT_OPTIONS.map((a) => {
                  const Icon = a.icon;
                  const active = aspectRatio === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAspectRatio(a.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center font-heading transition-all",
                        active ? studioOptionActive : studioOptionIdle
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.5} />
                      <span className="text-[11px] font-semibold">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={studioSection}>Video model</p>
              <div className="mt-3 space-y-2">
                {VIDEO_MODELS.map((m) => {
                  const active = videoModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setVideoModelId(m.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left font-heading transition-all",
                        active ? studioOptionActive : studioOptionIdle
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border text-[10px] font-bold",
                          active
                            ? "border-studio-accent/40 bg-studio-accent/15 text-white"
                            : "border-studio-line bg-black/40 text-white/45"
                        )}
                      >
                        <Clapperboard className="size-4" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0">
                        <span className="text-sm font-semibold text-white">{m.name}</span>
                        <span className="mt-0.5 block font-body text-xs leading-snug text-white/50">{m.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={studioSection}>Negative prompt</p>
              <textarea
                className={cn(studioField(), "mt-3 min-h-[68px] resize-y")}
                placeholder="Optional"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
            </div>

            {videoCost === 0 ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                Video generation is set to <span className="font-semibold">0 credits</span> for testing. Restore{" "}
                <code className="rounded bg-black/30 px-1">CREDIT_COSTS.video</code> in code when you go live.
              </p>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-200">
                {error}
              </div>
            ) : null}
          </>
        }
        leftFooter={
          <div className="space-y-2">
            <button
              type="button"
              onClick={run}
              disabled={!canRun}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-heading text-sm font-semibold transition-all",
                "bg-studio-accent text-white shadow-studio-generate",
                "hover:bg-studio-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studio-accent",
                "disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {status === "uploading"
                    ? "Uploading…"
                    : status === "processing"
                      ? "Rendering video…"
                      : "Starting…"}
                </>
              ) : (
                <>
                  <Film className="size-4" />
                  Generate video
                  {videoCost > 0 ? ` · ${videoCost} credits` : " · free (test)"}
                </>
              )}
            </button>
            {!hasBothImages ? (
              <p className="text-center font-body text-[11px] text-white/50">Upload start and end images to enable.</p>
            ) : null}
          </div>
        }
        right={
          <>
            <div className="flex items-center justify-between border-b border-studio-line px-5 py-4 lg:px-8">
              <div className="flex items-center gap-2 font-heading text-sm font-medium text-white">
                <Video className="size-4 text-white/70" />
                Preview
              </div>
              {result ? (
                <a
                  className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-white/80 hover:text-white"
                  href={result}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="size-3.5" />
                  Download MP4
                </a>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-8">
              {running ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-studio-line bg-black/50 px-6 py-20">
                  <Loader2 className="size-10 animate-spin text-studio-accent" />
                  <p className="text-center font-body text-sm text-white/50">Working on your clip…</p>
                </div>
              ) : result ? (
                <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-studio-line bg-black/60 shadow-glow">
                  <video className="max-h-[min(72vh,780px)] w-full object-contain" controls src={result} />
                </div>
              ) : startFrame.previewUrl && endFrame.previewUrl ? (
                <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-studio-line bg-black/40 p-4">
                  <p className="text-center font-body text-xs text-white/50">Start → End reference</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-lg border border-studio-line">
                      <img
                        src={startFrame.previewUrl}
                        alt="Start"
                        className="aspect-video w-full object-cover"
                      />
                      <p className="bg-black/60 px-2 py-1 text-center font-body text-[10px] text-white/50">Start</p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-studio-line">
                      <img
                        src={endFrame.previewUrl}
                        alt="End"
                        className="aspect-video w-full object-cover"
                      />
                      <p className="bg-black/60 px-2 py-1 text-center font-body text-[10px] text-white/50">End</p>
                    </div>
                  </div>
                  <p className="text-center font-body text-sm text-white/50">
                    Add a prompt and press <span className="font-medium text-white">Generate video</span>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-studio-line bg-black/40 px-6 py-24 text-center">
                  <div className="mb-4 rounded-2xl border border-studio-line bg-black/50 p-5">
                    <Sparkles className="mx-auto size-10 text-white/35" strokeWidth={1} />
                  </div>
                  <p className="max-w-sm font-heading text-sm font-semibold text-white">Video preview</p>
                  <p className="mt-2 max-w-md font-body text-xs leading-relaxed text-white/50">
                    Choose start and end frames on the left. Your rendered MP4 will appear here.
                  </p>
                </div>
              )}
            </div>
          </>
        }
      />
    </>
  );
}
