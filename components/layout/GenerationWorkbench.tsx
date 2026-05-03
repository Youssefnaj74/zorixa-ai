"use client";

import { useCallback, useMemo, useState } from "react";

import { HistoryPanel, LipsyncStrip, type HistoryItem } from "@/components/layout/HistoryPanel";
import { ImageBottomBar } from "@/components/layout/ImageBottomBar";
import { Navbar } from "@/components/layout/Navbar";
import { PromptBar } from "@/components/layout/PromptBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { OutputPreview } from "@/components/ui/OutputPreview";
import { cn } from "@/lib/utils";

const MOCK_IMAGE =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80&auto=format&fit=crop";

export function GenerationWorkbench({ mode }: { mode: "image" | "video" }) {
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("Ultra-detailed product hero, soft purple rim light, 50mm.");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [negativeOpen, setNegativeOpen] = useState(false);

  const [modelId, setModelId] = useState("nano-banana-2");
  const [cameraStyle, setCameraStyle] = useState("None");
  const [resolution, setResolution] = useState("2K");
  const [aspect, setAspect] = useState("Auto");
  const [webSearch, setWebSearch] = useState(false);
  const [crispUpscale, setCrispUpscale] = useState(false);

  const [durationSec, setDurationSec] = useState(5);
  const [fps, setFps] = useState(24);
  const [motion, setMotion] = useState(50);

  const [loading, setLoading] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: "h1",
      thumb: "https://picsum.photos/seed/z1/96/96",
      label: "Neon portrait concept"
    },
    {
      id: "h2",
      thumb: "https://picsum.photos/seed/z2/96/96",
      label: "Studio packshot v2"
    }
  ]);

  const creditsLabelVideo = "~90.00 CR";
  const creditsLabelImage = "-90.00 CR";

  const applyReferenceFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setReferencePreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setPrompt((p) => {
      if (p.includes("@PRODUCT_IMAGE1")) return p;
      return `Using @PRODUCT_IMAGE1 ${p.replace(/^Using\s*/, "").trim()}`.trim();
    });
  }, []);

  const runGeneration = useCallback(() => {
    setLoading(true);
    setOutputUrl(null);
    window.setTimeout(() => {
      const url =
        mode === "video"
          ? "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          : MOCK_IMAGE;
      setOutputUrl(url);
      setLoading(false);
      const id = `gen-${Date.now()}`;
      setHistory((prev) => [
        {
          id,
          thumb:
            mode === "video"
              ? "https://picsum.photos/seed/vid/96/96"
              : `https://picsum.photos/seed/${id.slice(-4)}/96/96`,
          label: prompt.slice(0, 42) || "New generation"
        },
        ...prev
      ]);
    }, 1600);
  }, [mode, prompt]);

  const historyItems = useMemo(() => history.slice(0, 8), [history]);

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg font-sans text-white">
      <Navbar />

      {mode === "video" ? (
        <PromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          showNegative={negativeOpen}
          onToggleNegative={() => setNegativeOpen((s) => !s)}
          placeholder="Describe motion, camera moves, and subject…"
        />
      ) : null}

      <div
        className={cn(
          mode === "video"
            ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:items-stretch"
            : "flex min-h-0 w-full shrink-0 flex-row gap-4 overflow-hidden px-4 pt-4"
        )}
        style={
          mode === "image"
            ? {
                height: "calc(100vh - 56px)",
                paddingBottom: 100
              }
            : undefined
        }
      >
        {mode === "video" ? (
          <Sidebar
            variant={mode}
            modelId={modelId}
            onModelChange={setModelId}
            cameraStyle={cameraStyle}
            onCameraStyleChange={setCameraStyle}
            resolution={resolution}
            onResolutionChange={setResolution}
            aspect={aspect}
            onAspectChange={setAspect}
            webSearch={webSearch}
            onWebSearchChange={setWebSearch}
            crispUpscale={crispUpscale}
            onCrispUpscaleChange={setCrispUpscale}
            creditsLabel={creditsLabelVideo}
            loading={loading}
            onGenerate={runGeneration}
            durationSec={durationSec}
            onDurationChange={setDurationSec}
            fps={fps}
            onFpsChange={setFps}
            motion={motion}
            onMotionChange={setMotion}
          />
        ) : null}

        {mode === "video" ? (
          <div className="flex min-h-[420px] min-w-0 flex-1 flex-col gap-4 lg:flex-row">
            <OutputPreview
              mode={mode}
              imageSrc={outputUrl}
              loading={loading}
              className="min-h-[360px] flex-1"
            />

            <div className="flex shrink-0 gap-2 lg:flex-col xl:flex-row">
              <HistoryPanel items={historyItems} className="lg:max-w-none" />
              <LipsyncStrip />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch gap-4 overflow-hidden">
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <OutputPreview
                mode={mode}
                imageSrc={outputUrl}
                loading={loading}
                className="h-full min-h-0 flex-1 overflow-hidden"
              />
            </div>

            <HistoryPanel
              items={historyItems}
              className="flex h-full min-h-0 w-[300px] min-w-[300px] max-w-[300px] shrink-0 flex-col self-stretch"
            />
          </div>
        )}
      </div>

      {mode === "image" ? (
        <ImageBottomBar
          prompt={prompt}
          onPromptChange={setPrompt}
          negativePrompt={negativePrompt}
          onNegativePromptChange={setNegativePrompt}
          showNegative={negativeOpen}
          onToggleNegative={() => setNegativeOpen((s) => !s)}
          referencePreviewUrl={referencePreviewUrl}
          onReferenceFile={applyReferenceFile}
          modelId={modelId}
          onModelChange={setModelId}
          resolution={resolution}
          onResolutionChange={setResolution}
          aspect={aspect}
          onAspectChange={setAspect}
          cameraStyle={cameraStyle}
          onCameraStyleChange={setCameraStyle}
          webSearch={webSearch}
          onWebSearchChange={setWebSearch}
          creditsLabel={creditsLabelImage}
          loading={loading}
          onGenerate={runGeneration}
        />
      ) : null}
    </div>
  );
}
