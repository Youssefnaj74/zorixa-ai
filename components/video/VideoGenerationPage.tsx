"use client";

import { useCallback, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { VideoHistoryEntry } from "@/components/video/VideoHistory";
import { VideoBottomBar } from "@/components/video/VideoBottomBar";
import { VideoHistory } from "@/components/video/VideoHistory";
import { VideoPreview } from "@/components/video/VideoPreview";

const NAV_H = 56;

export function VideoGenerationPage() {
  const [bottomBarHeight, setBottomBarHeight] = useState(130);

  const [modeValue, setModeValue] = useState("UGC");

  const [composerModelId, setComposerModelId] = useState("seedance-2");
  const [fullAccessOn, setFullAccessOn] = useState(false);
  const [durationStandard, setDurationStandard] = useState("Standard");
  const [timeSeconds, setTimeSeconds] = useState(10);
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("1080p");
  const [aiAgent, setAiAgent] = useState(false);

  const [actionTab, setActionTab] = useState<ActionTab>("Image to Video");
  const [prompt, setPrompt] = useState("");

  const [promptImageUrl, setPromptImageUrl] = useState<string | null>(null);
  const [promptImage2Url, setPromptImage2Url] = useState<string | null>(null);

  const setPromptImageUrlSafe = useCallback((url: string | null) => {
    setPromptImageUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const setPromptImage2UrlSafe = useCallback((url: string | null) => {
    setPromptImage2Url((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [history, setHistory] = useState<VideoHistoryEntry[]>([
    {
      id: "h1",
      thumb: "https://picsum.photos/seed/neon/96/96",
      title: "Neon portrait concept"
    },
    {
      id: "h2",
      thumb: "https://picsum.photos/seed/mountain/96/96",
      title: "Studio packshot v2"
    }
  ]);

  const creditsLine = "428 CR/s";

  const handleBottomBarHeight = useCallback((height: number) => {
    setBottomBarHeight(height);
  }, []);

  const handleComposerModelChange = useCallback((id: string) => {
    setComposerModelId(id);
    setGenerateError(null);
    if (id === "kling-3-pro") {
      setActionTab("Text to Video");
    }
  }, []);

  const runGeneration = useCallback(async () => {
    setGenerateError(null);
    setVideoUrl(null);

    if (composerModelId === "kling-3-pro") {
      const trimmed = prompt.trim();
      if (!trimmed) {
        setGenerateError("Enter a prompt to generate a video.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed })
        });

        let data: { video_url?: string; error?: string } = {};
        try {
          data = (await res.json()) as { video_url?: string; error?: string };
        } catch {
          setGenerateError(`Generation failed (${res.status})`);
          return;
        }

        if (!res.ok) {
          setGenerateError(data.error ?? `Generation failed (${res.status})`);
          return;
        }

        if (!data.video_url) {
          setGenerateError("No video URL was returned.");
          return;
        }

        setVideoUrl(data.video_url);
        const id = `v-${Date.now()}`;
        setHistory((prev) => [
          {
            id,
            thumb: `https://picsum.photos/seed/${id.slice(-6)}/96/96`,
            title: trimmed.slice(0, 40) || "Kling 3.0 Pro"
          },
          ...prev
        ]);
      } catch {
        setGenerateError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const url = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      setVideoUrl(url);
      setLoading(false);
      const id = `v-${Date.now()}`;
      setHistory((prev) => [
        {
          id,
          thumb: `https://picsum.photos/seed/${id.slice(-6)}/96/96`,
          title: prompt.slice(0, 40) || "New render"
        },
        ...prev
      ]);
    }, 1800);
  }, [composerModelId, prompt]);

  const restoreSettings = useCallback((item: VideoHistoryEntry) => {
    setPrompt((p) => `${p.split("\n")[0]}\n(Restored: ${item.title})`);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg">
      <Navbar fixed />

      <div
        className="box-border flex min-h-0 flex-1 flex-col px-4 pt-0"
        style={{
          marginTop: NAV_H,
          paddingBottom: bottomBarHeight
        }}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-4 overflow-x-hidden font-body lg:flex-row lg:items-stretch lg:gap-5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-0">
            <VideoPreview
              actionTab={actionTab}
              onActionTabChange={setActionTab}
              videoUrl={videoUrl}
              loading={loading}
              errorMessage={generateError}
              promptThumbUrl={composerModelId === "kling-3-pro" ? null : promptImageUrl}
              bottomBarHeight={bottomBarHeight}
              className="scrollbar-hide h-full min-h-0 w-full min-w-0 flex-1"
            />
          </div>

          <VideoHistory
            items={history}
            onSelect={restoreSettings}
            scrollPaddingBottom={0}
            className="h-auto max-h-[min(42vh,380px)] min-h-0 w-full shrink-0 lg:h-full lg:max-h-none lg:w-[300px] lg:min-w-[300px] lg:max-w-[300px]"
          />
        </div>
      </div>

      <VideoBottomBar
        prompt={prompt}
        onPromptChange={(v) => {
          setGenerateError(null);
          setPrompt(v);
        }}
        promptImageUrl={promptImageUrl}
        onPromptImageChange={setPromptImageUrlSafe}
        promptImage2Url={promptImage2Url}
        onPromptImage2Change={setPromptImage2UrlSafe}
        composerModelId={composerModelId}
        onComposerModelChange={handleComposerModelChange}
        fullAccessOn={fullAccessOn}
        onFullAccessChange={setFullAccessOn}
        modeValue={modeValue}
        onModeChange={setModeValue}
        durationStandard={durationStandard}
        onDurationStandardChange={setDurationStandard}
        timeSeconds={timeSeconds}
        onTimeSecondsChange={setTimeSeconds}
        aspect={aspect}
        onAspectChange={setAspect}
        resolution={resolution}
        onResolutionChange={setResolution}
        aiAgent={aiAgent}
        onAiAgentChange={setAiAgent}
        creditsLine={creditsLine}
        loadingGenerate={loading}
        onGenerate={runGeneration}
        onHeightChange={handleBottomBarHeight}
      />
    </div>
  );
}
