"use client";

import { useCallback, useRef, useState } from "react";
import {
  Cpu,
  Download,
  ImagePlus,
  Loader2,
  Sparkles,
  Wand2,
  X
} from "lucide-react";

import { BeforeAfterSlider } from "@/components/dashboard/before-after-slider";
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

type SlotOutcome = {
  outputUrl: string | null;
  error: string | null;
  busy: boolean;
};

const idleOutcome = (): SlotOutcome => ({ outputUrl: null, error: null, busy: false });

export function EnhanceStudio() {
  const image1FileInputRef = useRef<HTMLInputElement>(null);
  const image2FileInputRef = useRef<HTMLInputElement>(null);
  const [image1FileInputKey, setImage1FileInputKey] = useState(0);
  const [image2FileInputKey, setImage2FileInputKey] = useState(0);

  const [frame1, setFrame1] = useState<FrameState>(emptyFrame);
  const [frame2, setFrame2] = useState<FrameState>(emptyFrame);

  const { balance, refresh: refreshCredits } = useCreditsBalance();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>("1:1");
  const [modelId, setModelId] = useState<EnhanceModelId>("codeformer");
  const [upscaleTier, setUpscaleTier] = useState<UpscaleTier>("2x");

  const [runBusy, setRunBusy] = useState(false);
  const [runPhase, setRunPhase] = useState<"idle" | "img1" | "img2">("idle");
  const [outcome1, setOutcome1] = useState<SlotOutcome>(idleOutcome);
  const [outcome2, setOutcome2] = useState<SlotOutcome>(idleOutcome);
  const [runError, setRunError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isSdxl = modelId === "sdxl";
  const isUpscaleModel = modelId === "real_esrgan";
  const needsCreativePrompt = isSdxl;

  const setFrame = useCallback((which: "1" | "2", file: File | null) => {
    const set = which === "1" ? setFrame1 : setFrame2;
    set((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      if (!file) return emptyFrame();
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        uploadedUrl: null
      };
    });
    setOutcome1(idleOutcome());
    setOutcome2(idleOutcome());
    setRunError(null);
  }, []);

  const clearImage1 = useCallback(() => {
    setFrame("1", null);
    if (image1FileInputRef.current) image1FileInputRef.current.value = "";
    setImage1FileInputKey((k) => k + 1);
  }, [setFrame]);

  const clearImage2 = useCallback(() => {
    setFrame("2", null);
    if (image2FileInputRef.current) image2FileInputRef.current.value = "";
    setImage2FileInputKey((k) => k + 1);
  }, [setFrame]);

  function handleImage1FileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) setFrame("1", file);
    e.target.value = "";
  }

  function handleImage2FileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) setFrame("2", file);
    e.target.value = "";
  }

  async function enhanceOneImage(inputUrl: string): Promise<string | null> {
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

    if (data.status === "completed") {
      return data.output_url ?? null;
    }
    if (data.id) {
      return await pollGenerationJob(data.id);
    }
    throw new Error("Invalid response");
  }

  async function runEnhanceBoth() {
    if (!frame1.file || !frame2.file) {
      setRunError("Add both Image 1 and Image 2.");
      return;
    }
    if (needsCreativePrompt && !prompt.trim()) {
      setRunError("Enter a prompt for SDXL creative edits.");
      return;
    }

    const costTotal = CREDIT_EACH * 2;
    if (CREDIT_EACH > 0) {
      const bal = await fetchCreditsBalance();
      if (bal === null) {
        setRunError("Could not verify your credits. Try refreshing.");
        return;
      }
      if (bal < costTotal) {
        setRunError(`Need ${costTotal} credits (2 × ${CREDIT_EACH}). You have ${bal}.`);
        return;
      }
    }

    setRunBusy(true);
    setRunError(null);
    setOutcome1({ outputUrl: null, error: null, busy: false });
    setOutcome2({ outputUrl: null, error: null, busy: false });

    try {
      let url1 = frame1.uploadedUrl;
      if (!url1) {
        url1 = await uploadFileToApi(frame1.file);
        setFrame1((f) => (f.file ? { ...f, uploadedUrl: url1 } : f));
      }
      let url2 = frame2.uploadedUrl;
      if (!url2) {
        url2 = await uploadFileToApi(frame2.file);
        setFrame2((f) => (f.file ? { ...f, uploadedUrl: url2 } : f));
      }

      setRunPhase("img1");
      setOutcome1((o) => ({ ...o, busy: true, error: null }));
      try {
        const out1 = await enhanceOneImage(url1!);
        setOutcome1({ outputUrl: out1, error: null, busy: false });
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
          setShowUpgrade(true);
          setOutcome1({ outputUrl: null, error: "Insufficient credits", busy: false });
          return;
        }
        setOutcome1({
          outputUrl: null,
          error: e instanceof Error ? e.message : "Failed",
          busy: false
        });
      }

      setRunPhase("img2");
      setOutcome2((o) => ({ ...o, busy: true, error: null }));
      try {
        const out2 = await enhanceOneImage(url2!);
        setOutcome2({ outputUrl: out2, error: null, busy: false });
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "INSUFFICIENT_CREDITS") {
          setShowUpgrade(true);
          setOutcome2({ outputUrl: null, error: "Insufficient credits", busy: false });
          return;
        }
        setOutcome2({
          outputUrl: null,
          error: e instanceof Error ? e.message : "Failed",
          busy: false
        });
      }
    } finally {
      setRunBusy(false);
      setRunPhase("idle");
      void refreshCredits();
    }
  }

  const hasBothImages = Boolean(frame1.file && frame2.file);
  const slotWorking = outcome1.busy || outcome2.busy;
  const running = runBusy || slotWorking;
  const canRun =
    hasBothImages && (!needsCreativePrompt || Boolean(prompt.trim())) && !running;

  const hasAnyResult = Boolean(outcome1.outputUrl || outcome2.outputUrl);
  const resultCount = (outcome1.outputUrl ? 1 : 0) + (outcome2.outputUrl ? 1 : 0);
  const testingNote = CREDIT_EACH === 0;

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <StudioShell
        title="Image studio"
        subtitle="Two sources, one model profile — both results land in the preview."
        badge="Enhance"
        left={
          <>
            <div>
              <p className={studioSection}>Source images</p>
              <p className="mt-1 font-body text-xs text-white/50">
                Exactly two images. Each slot has its own file input, preview, and remove control.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-center font-heading text-xs font-medium text-white/50">Image 1</p>
                  <label
                    className={cn(
                      "flex aspect-[4/5] min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-studio-line bg-black/30 p-2 transition-colors hover:border-white/12"
                    )}
                  >
                    <input
                      key={`enhance-img1-${image1FileInputKey}`}
                      ref={image1FileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImage1FileChange}
                    />
                    {frame1.previewUrl ? (
                      <div className="relative size-full min-h-[100px] w-full">
                        <img
                          src={frame1.previewUrl}
                          alt="Image 1"
                          className="size-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            clearImage1();
                          }}
                          className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-black/70 text-white hover:bg-red-500/90"
                          aria-label="Remove image 1"
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
                  <p className="mb-1.5 text-center font-heading text-xs font-medium text-white/50">Image 2</p>
                  <label
                    className={cn(
                      "flex aspect-[4/5] min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-studio-line bg-black/30 p-2 transition-colors hover:border-white/12"
                    )}
                  >
                    <input
                      key={`enhance-img2-${image2FileInputKey}`}
                      ref={image2FileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImage2FileChange}
                    />
                    {frame2.previewUrl ? (
                      <div className="relative size-full min-h-[100px] w-full">
                        <img
                          src={frame2.previewUrl}
                          alt="Image 2"
                          className="size-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            clearImage2();
                          }}
                          className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-black/70 text-white hover:bg-red-500/90"
                          aria-label="Remove image 2"
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

            {testingNote ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                Enhancement is <span className="font-semibold">0 credits</span> for testing. Restore{" "}
                <code className="rounded bg-black/30 px-1">CREDIT_COSTS.enhance</code> when you go live.
              </p>
            ) : null}

            <div>
              <p className={studioSection}>Prompt</p>
              <textarea
                className={cn(studioField(), "mt-3 min-h-[100px] resize-y")}
                placeholder={
                  isSdxl
                    ? "e.g. Cinematic product shot, soft studio light, premium packaging…"
                    : "Optional. Required for SDXL — describe the style or fix you want."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {!isSdxl ? (
                <p className="mt-2 font-body text-xs leading-relaxed text-white/50">
                  Used for Stable Diffusion XL. Other models ignore this field.
                </p>
              ) : null}
            </div>

            <div>
              <p className={studioSection}>Aspect ratio</p>
              <p className="mt-1 font-body text-xs text-white/50">Frames SDXL output. Restores & upscalers keep your upload framing.</p>
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
                      <span className="font-body text-[10px] leading-tight text-white/45">{a.hint}</span>
                    </button>
                  );
                })}
              </div>
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
              <p className="mt-2 font-body text-xs text-white/50">SDXL only; ignored for restore / upscale models.</p>
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
                          "flex flex-1 flex-col items-center rounded-xl border py-2.5 font-heading transition-all",
                          active ? studioOptionActive : studioOptionIdle
                        )}
                      >
                        <span className="text-sm font-semibold">{u.label}</span>
                        <span className="font-body text-[10px] text-white/45">{u.sub}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 font-body text-xs text-white/50">8× may cap at 4× depending on the hosted model.</p>
              </div>
            ) : null}

            {runError ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-200">
                {runError}
              </div>
            ) : null}
          </>
        }
        leftFooter={
          <div className="space-y-3">
            {balance !== null && hasBothImages && CREDIT_EACH > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 font-body text-xs text-white/50">
                <span>
                  Balance: <span className="font-heading font-semibold text-white">{balance}</span>
                </span>
                <span>
                  This run: <span className="font-heading font-semibold text-white">{CREDIT_EACH * 2}</span> credits
                </span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={runEnhanceBoth}
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
                  {runPhase === "img1" || outcome1.busy
                    ? "Enhancing image 1…"
                    : runPhase === "img2" || outcome2.busy
                      ? "Enhancing image 2…"
                      : "Working…"}
                </>
              ) : (
                <>
                  <Wand2 className="size-4" />
                  Enhance Both Images
                  {CREDIT_EACH > 0 ? ` · ${CREDIT_EACH * 2} credits` : " · free (test)"}
                </>
              )}
            </button>
            {!hasBothImages ? (
              <p className="text-center font-body text-[11px] text-white/50">Upload both images to enable.</p>
            ) : needsCreativePrompt && !prompt.trim() ? (
              <p className="text-center font-body text-[11px] text-white/50">SDXL requires a prompt.</p>
            ) : null}
          </div>
        }
        right={
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-studio-line px-5 py-4 lg:px-8">
              <div className="flex items-center gap-2 font-heading text-sm font-medium text-white">
                <Sparkles className="size-4 text-white/70" />
                Preview
                {hasAnyResult ? (
                  <span className="rounded-full border border-studio-line bg-black/40 px-2 py-0.5 font-body text-xs font-normal text-white/50">
                    {resultCount} {resultCount === 1 ? "result" : "results"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="studio-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-4 lg:p-6">
              {!frame1.previewUrl && !frame2.previewUrl ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-studio-line bg-black/40 px-6 py-20 text-center">
                  <div className="mb-4 rounded-2xl border border-studio-line bg-black/50 p-5">
                    <Sparkles className="mx-auto size-10 text-white/35" strokeWidth={1} />
                  </div>
                  <p className="font-heading text-sm font-semibold text-white">Dual before / after</p>
                  <p className="mt-2 max-w-md font-body text-xs text-white/50">
                    Add Image 1 and Image 2, then run. Each card gets its own comparison slider.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-studio-line bg-black/40 p-4 shadow-glow">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <ResultCard
                    label="Image 1"
                    fileName={frame1.file?.name}
                    previewUrl={frame1.previewUrl}
                    outcome={outcome1}
                  />
                  <ResultCard
                    label="Image 2"
                    fileName={frame2.file?.name}
                    previewUrl={frame2.previewUrl}
                    outcome={outcome2}
                  />
                  </div>
                </div>
              )}
            </div>
          </>
        }
      />
    </>
  );
}

function ResultCard({
  label,
  fileName,
  previewUrl,
  outcome
}: {
  label: string;
  fileName: string | undefined;
  previewUrl: string | null;
  outcome: SlotOutcome;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-studio-line bg-black/50">
      <div className="border-b border-studio-line bg-black/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading text-xs font-semibold text-white">{label}</span>
          {fileName ? (
            <span className="truncate font-body text-[11px] text-white/50" title={fileName}>
              {fileName}
            </span>
          ) : null}
        </div>
        {outcome.error ? <p className="mt-1 font-body text-[11px] text-red-400">{outcome.error}</p> : null}
      </div>

      <div className="relative min-h-[200px] bg-black/40 p-1">
        {!previewUrl ? (
          <div className="grid min-h-[180px] place-items-center font-body text-xs text-white/50">No image</div>
        ) : outcome.outputUrl ? (
          <div className="p-1">
            <BeforeAfterSlider beforeUrl={previewUrl} afterUrl={outcome.outputUrl} />
          </div>
        ) : outcome.busy ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 animate-spin text-studio-accent" />
            <span className="font-body text-xs text-white/50">Processing…</span>
          </div>
        ) : (
          <div className="relative">
            <img
              src={previewUrl}
              alt=""
              className="max-h-[280px] w-full object-contain opacity-85"
            />
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent py-4 text-center font-body text-xs text-white/50">
              Awaiting run
            </p>
          </div>
        )}
      </div>

      {outcome.outputUrl ? (
        <div className="border-t border-studio-line px-3 py-2">
          <a
            className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-white/80 hover:text-white"
            href={outcome.outputUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Download className="size-3.5" />
            Download
          </a>
        </div>
      ) : null}
    </article>
  );
}
