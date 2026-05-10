"use client";

import { useCallback, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";

import type { ActionTab } from "@/components/video/ActionTabsRow";
import type { VideoGenerateContext } from "@/components/video/VideoBottomBar";
import type { VideoHistoryEntry } from "@/components/video/VideoHistory";
import { VideoBottomBar } from "@/components/video/VideoBottomBar";
import { VideoHistory } from "@/components/video/VideoHistory";
import { VideoPreview } from "@/components/video/VideoPreview";

const NAV_H = 56;

/** Resolve blob: URLs to a public https URL via authenticated upload. */
async function uploadBlobUrlIfNeeded(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  if (!url.startsWith("blob:")) return url;

  const blobRes = await fetch(url);
  const blob = await blobRes.blob();
  const ext = blob.type.startsWith("audio/")
    ? "mp3"
    : blob.type.startsWith("video/")
      ? "mp4"
      : "png";
  const file = new File([blob], `upload.${ext}`, {
    type: blob.type || "application/octet-stream"
  });
  const form = new FormData();
  form.set("file", file);
  const up = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "include"
  });
  if (!up.ok) {
    let msg = "Upload failed — sign in and try again.";
    try {
      const j = (await up.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await up.json()) as { url: string };
  return data.url;
}

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
  const [lipsyncAudioUrl, setLipsyncAudioUrl] = useState<string | null>(null);
  const [editSourceVideoUrl, setEditSourceVideoUrl] = useState<string | null>(null);

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

  const setLipsyncAudioUrlSafe = useCallback((url: string | null) => {
    setLipsyncAudioUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const setEditSourceVideoUrlSafe = useCallback((url: string | null) => {
    setEditSourceVideoUrl((prev) => {
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

  const runGeneration = useCallback(
    async (ctx: VideoGenerateContext) => {
      setGenerateError(null);
      setVideoUrl(null);

      // Merge context + React state: avoids empty prompt when Generate runs before the last onChange commits.
      const promptValue = ctx.promptText.trim() || prompt.trim();

      if (composerModelId !== "kling-3-pro") {
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
              title: promptValue.slice(0, 40) || "New render"
            },
            ...prev
          ]);
        }, 1800);
        return;
      }

      if (!promptValue) {
        setGenerateError("Enter a prompt to generate a video.");
        return;
      }

      setLoading(true);
      try {
        let payload: Record<string, unknown>;

        switch (ctx.actionTab) {
          case "Text to Video":
            payload = { prompt: promptValue, action: "text" };
            break;
          case "Image to Video": {
            const image_url = await uploadBlobUrlIfNeeded(ctx.promptImageUrl);
            if (!image_url) {
              setGenerateError("Add a Products image for Image to Video.");
              return;
            }
            payload = { prompt: promptValue, action: "image", image_url };
            break;
          }
          case "Lipsyncing": {
            const audio_url = await uploadBlobUrlIfNeeded(ctx.lipsyncAudioUrl);
            if (!audio_url) {
              setGenerateError("Add an audio file for Lipsyncing.");
              return;
            }
            payload = { prompt: promptValue, action: "lipsync", audio_url };
            break;
          }
          case "Video Edit": {
            const video_url = await uploadBlobUrlIfNeeded(ctx.editSourceVideoUrl);
            if (!video_url) {
              setGenerateError("Add a source video for Video Edit.");
              return;
            }
            payload = { prompt: promptValue, action: "edit", video_url };
            break;
          }
          default:
            payload = { prompt: promptValue, action: "text" };
        }

        console.log("[VideoGenerationPage] POST /api/generate-video body", payload);
        console.log(
          "[VideoGenerationPage] exact prompt before fetch:",
          JSON.stringify(promptValue),
          "| length:",
          promptValue.length,
          "| ctx:",
          JSON.stringify(ctx.promptText.trim()),
          "| parent state:",
          JSON.stringify(prompt.trim())
        );

        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
            title: promptValue.slice(0, 40) || "Kling 3.0 Pro"
          },
          ...prev
        ]);
      } catch (e: unknown) {
        setGenerateError(e instanceof Error ? e.message : "Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [composerModelId, prompt]
  );

  const restoreSettings = useCallback((item: VideoHistoryEntry) => {
    setPrompt((p) => `${p.split("\n")[0]}\n(Restored: ${item.title})`);
  }, []);

  const hidePromptThumb =
    composerModelId === "kling-3-pro" && actionTab === "Text to Video";

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
              promptThumbUrl={hidePromptThumb ? null : promptImageUrl}
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
        actionTab={actionTab}
        promptImageUrl={promptImageUrl}
        onPromptImageChange={setPromptImageUrlSafe}
        promptImage2Url={promptImage2Url}
        onPromptImage2Change={setPromptImage2UrlSafe}
        lipsyncAudioUrl={lipsyncAudioUrl}
        onLipsyncAudioUrlChange={setLipsyncAudioUrlSafe}
        editSourceVideoUrl={editSourceVideoUrl}
        onEditSourceVideoUrlChange={setEditSourceVideoUrlSafe}
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
