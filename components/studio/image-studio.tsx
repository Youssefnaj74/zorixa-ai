"use client";

import { useCallback, useRef, useState } from "react";
import { Cpu, Download, ImagePlus, Loader2, Sparkles, Wand2, X } from "lucide-react";

import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import {
  fetchCreditsBalance,
  pollGenerationJob,
  uploadFileToApi
} from "@/components/studio/batch-jobs";
import { useCreditsBalance } from "@/components/studio/use-batch-credits";
import { StudioShell } from "@/components/studio/studio-shell";
import {
  studioField,
  studioOptionActive,
  studioOptionIdle,
  studioSection
} from "@/components/studio/studio-styles";
import {
  ASPECT_OPTIONS,
  ENHANCE_MODELS,
  UPSCALE_OPTIONS,
  type AspectRatioId,
  type EnhanceModelId,
  type UpscaleTier
} from "@/lib/studio-constants";
import { CREDIT_COSTS } from "@/lib/replicate";
import { cn } from "@/lib/utils";

const CREDIT_EACH = CREDIT_COSTS.enhance;

type FrameState = {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
};

const emptyFrame = (): FrameState => ({ file: null, previewUrl: null, uploadedUrl: null });

export function ImageStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [frame, setFrame] = useState<FrameState>(emptyFrame);
  const { balance, refresh: refreshCredits } = useCreditsBalance();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("1:1");
  const [modelId, setModelId] = useState<EnhanceModelId>("codeformer");
  const [upscaleTier, setUpscaleTier] = useState<UpscaleTier>("2x");

  const [running, setRunning] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSdxl = modelId === "sdxl";
  const isUpscaleModel = modelId === "real_esrgan";
  const needsCreativePrompt = isSdxl;

  const setFile = useCallback((file: File | null) => {
    setFrame((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      if (!file) return emptyFrame();
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        uploadedUrl: null
      };
    });
    setOutputUrl(null);
    setRunError(null);
  }, []);

  const clearImage = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileInputKey((k) => k + 1);
  }, [setFile]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) setFile(file);
    e.target.value = "";
  }

  async function runEnhance(inputUrl: string): Promise<string | null> {
    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input_url: inputUrl,
        model: modelId,
        upscale: upscaleTier,
        prompt: prompt.trim() || undefined,
        negative_prompt: negativePrompt.trim() || undefined,
        aspect_ratio: aspectRatio
      })
    });

    const data = (await res.json()) as {
      id?: string;
      status?: string;
      output_url?: string;
      error?: string;
    };

    if (res.status === 402 && data.error === "INSUFFICIENT_CREDITS") {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    if (!res.ok) throw new Error(data.error ?? "Request failed");

    if (data.status === "completed") return data.output_url ?? null;
    if (data.id) return await pollGenerationJob(data.id);
    throw new Error("Invalid response");
  }

  async function handleGenerate() {
    if (!frame.file) {
      setRunError("Add a source image.");
      return;
    }
    if (needsCreativePrompt && !prompt.trim()) {
      setRunError("Enter a prompt for SDXL.");
      return;
    }

    if (CREDIT_EACH > 0) {
      const bal = await fetchCreditsBalance();
      if (bal === null) {
        setRunError("Could not verify credits.");
        return;
      }
      if (bal < CREDIT_EACH) {
        setRunError(`Need ${CREDIT_EACH} credits. You have ${bal}.`);
        return;
      }
    }

    setRunning(true);
    setRunError(null);
    setOutputUrl(null);

    try {
      let url = frame.uploadedUrl;
      if (!url) {
        url = await uploadFileToApi(frame.file);
        setFrame((f) => (f.file ? { ...f, uploadedUrl: url } : f));
      }
      const out = await runEnhance(url!);
      setOutputUrl(out);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
        setShowUpgrade(true);
      } else {
        setRunError(e instanceof Error ? e.message : "Failed");
      }
    } finally {
      setRunning(false);
      void refreshCredits();
    }
  }

  async function copyOutputLink() {
    if (!outputUrl) return;
    try {
      await navigator.clipboard.writeText(outputUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const canGenerate =
    Boolean(frame.file) && (!needsCreativePrompt || Boolean(prompt.trim())) && !running;

  const costLabel = CREDIT_EACH > 0 ? `${CREDIT_EACH} credits` : "Free (test)";

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <StudioShell
        title="Image studio"
        subtitle="Model, framing, and prompt — output appears on the canvas."
        badge="Generate"
        left={
          <>
            <div>
              <p className={studioSection}>Source image</p>
              <p className="mt-1 font-body text-xs text-white/50">
                Upload a photo to enhance or restyle with your selected model.
              </p>
              <label
                className={cn(
                  "mt-3 flex aspect-[4/3] min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-studio-line bg-black/40 p-4 transition-colors hover:border-white/15"
                )}
              >
                <input
                  key={`img-${fileInputKey}`}
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {frame.previewUrl ? (
                  <div className="relative size-full min-h-[120px] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.previewUrl}
                      alt="Source"
                      className="size-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.preventDefault();
                        clearImage();
                      }}
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-black/85 font-heading text-white hover:bg-white/15"
                      aria-label="Remove image"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="size-10 text-white/45" strokeWidth={1.25} />
                    <span className="mt-3 font-heading text-sm font-semibold text-white">Upload image</span>
                    <span className="mt-1 font-body text-xs text-white/50">PNG, JPG, WebP</span>
                  </>
                )}
              </label>
            </div>

            <div>
              <p className={studioSection}>Model</p>
              <div className="mt-3 space-y-2">
                {ENHANCE_MODELS.map((m) => {
                  const active = modelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelId(m.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left font-heading transition-all",
                        active ? studioOptionActive : studioOptionIdle
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border text-[10px]",
                          active
                            ? "border-studio-accent/40 bg-studio-accent/15 text-white"
                            : "border-studio-line bg-black/50 text-white/45"
                        )}
                      >
                        <Cpu className="size-4" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{m.name}</span>
                          {m.badge ? (
                            <span className="rounded-md border border-studio-accent/35 bg-studio-accent/12 px-1.5 py-px font-heading text-[10px] font-medium text-studio-accent">
                              {m.badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block font-body text-xs leading-snug text-white/50">
                          {m.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={studioSection}>Aspect ratio</p>
              <p className="mt-1 font-body text-xs text-white/50">
                Applies to SDXL output; restores keep your upload framing.
              </p>
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
                        "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center font-heading transition-all",
                        active ? studioOptionActive : studioOptionIdle
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.5} />
                      <span className="text-[11px] font-semibold">{a.label}</span>
                      <span className="font-body text-[10px] leading-tight text-white/40">{a.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={studioSection}>Prompt</p>
              <textarea
                className={cn(studioField(), "mt-3 min-h-[120px] resize-y")}
                placeholder={
                  isSdxl
                    ? "Describe the look you want — lighting, style, mood…"
                    : "Optional for most models. Required for SDXL."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <p className={studioSection}>Negative prompt</p>
              <textarea
                className={cn(studioField(), "mt-3 min-h-[68px] resize-y")}
                placeholder="Optional — things to avoid"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
              <p className="mt-2 font-body text-xs text-white/50">Mostly used with SDXL.</p>
            </div>

            {isUpscaleModel ? (
              <div>
                <p className={studioSection}>Upscale quality</p>
                <div className="mt-3 flex gap-2">
                  {UPSCALE_OPTIONS.map((u) => {
                    const active = upscaleTier === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUpscaleTier(u.id)}
                        className={cn(
                          "flex flex-1 flex-col items-center rounded-2xl border py-2.5 font-heading transition-all",
                          active ? studioOptionActive : studioOptionIdle
                        )}
                      >
                        <span className="text-sm font-semibold">{u.label}</span>
                        <span className="font-body text-[10px] text-white/45">{u.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {runError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 font-body text-xs leading-relaxed text-red-200">
                {runError}
              </div>
            ) : null}

            {balance !== null && CREDIT_EACH > 0 ? (
              <p className="font-body text-xs text-white/50">
                Balance: <span className="font-heading font-semibold text-white">{balance}</span>
              </p>
            ) : null}
          </>
        }
        right={
          <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
            <div
              className={cn(
                "relative flex min-h-[min(52vh,520px)] flex-1 flex-col overflow-hidden rounded-2xl border border-studio-line bg-black/60 shadow-glow"
              )}
            >
              {running ? (
                <>
                  <div className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="absolute inset-y-0 w-[38%] rounded-full bg-studio-accent animate-studio-indeterminate" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
                    <Loader2 className="size-14 animate-spin text-studio-accent" aria-hidden />
                    <p className="font-heading text-sm font-semibold text-white">Generating</p>
                    <p className="max-w-xs text-center font-body text-sm text-white/50">
                      Applying your model settings — this may take a minute.
                    </p>
                  </div>
                </>
              ) : outputUrl ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="relative flex flex-1 items-center justify-center overflow-auto p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={outputUrl}
                      alt="Result"
                      className="max-h-full max-w-full rounded-xl object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 border-t border-studio-line bg-black/70 px-4 py-4">
                    <a
                      href={outputUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-studio-line px-5 py-2.5 font-heading text-sm font-semibold text-white transition-colors hover:bg-white/5 sm:flex-none"
                    >
                      <Download className="size-4" />
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={copyOutputLink}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-studio-line px-5 py-2.5 font-heading text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 sm:flex-none"
                    >
                      <Sparkles className="size-4" />
                      {copied ? "Copied link" : "Use image"}
                    </button>
                  </div>
                </div>
              ) : frame.previewUrl ? (
                <div className="relative flex flex-1 flex-col items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.previewUrl}
                    alt="Preview"
                    className="max-h-[min(55vh,480px)] max-w-full rounded-xl object-contain opacity-90"
                  />
                  <p className="mt-6 font-body text-sm text-white/50">
                    Ready — press Generate to process this image.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="rounded-2xl border border-studio-line bg-black/50 p-6">
                    <Wand2 className="mx-auto size-12 text-white/35" strokeWidth={1.25} />
                  </div>
                  <p className="font-heading text-base font-semibold text-white">Output preview</p>
                  <p className="max-w-sm font-body text-sm text-white/50">
                    Your result appears here with a soft accent glow on the frame. Upload a source image and choose a
                    model to begin.
                  </p>
                </div>
              )}
            </div>
          </div>
        }
        rightFooter={
          <div className="flex flex-wrap items-center justify-end gap-4">
            <span className="mr-auto font-body text-xs text-white/50">
              {CREDIT_EACH > 0 ? (
                <>
                  Cost: <span className="font-heading font-semibold text-white">{CREDIT_EACH}</span> credits
                </>
              ) : (
                <span className="font-heading text-white/60">No charge (test mode)</span>
              )}
            </span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-studio-accent px-8 py-3 font-heading text-sm font-semibold text-white shadow-studio-generate transition-all",
                "hover:bg-studio-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studio-accent",
                "disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="size-4" />
                  Generate · {costLabel}
                </>
              )}
            </button>
          </div>
        }
      />
    </>
  );
}
