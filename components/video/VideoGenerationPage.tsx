"use client";

import { useCallback, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { VideoHistoryEntry } from "@/components/video/VideoHistory";
import { VideoBottomBar } from "@/components/video/VideoBottomBar";
import { VideoHistory } from "@/components/video/VideoHistory";
import { VideoPreview } from "@/components/video/VideoPreview";

const NAV_H = 56;

const DEFAULT_PROMPT = "Using @PRODUCT_IMAGE1 hav…";

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
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

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

  const runGeneration = useCallback(() => {
    setLoading(true);
    setVideoUrl(null);
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
  }, [prompt]);

  const restoreSettings = useCallback((item: VideoHistoryEntry) => {
    setPrompt((p) => `${p.split("\n")[0]}\n(Restored: ${item.title})`);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-zorixa-bg">
      <Navbar avatarLetter="N" fixed />

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
              promptThumbUrl={promptImageUrl}
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
        onPromptChange={setPrompt}
        promptImageUrl={promptImageUrl}
        onPromptImageChange={setPromptImageUrlSafe}
        promptImage2Url={promptImage2Url}
        onPromptImage2Change={setPromptImage2UrlSafe}
        composerModelId={composerModelId}
        onComposerModelChange={setComposerModelId}
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
