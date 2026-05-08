"use client";

import { useCallback, useRef, useState } from "react";
import { Clapperboard, Download, Film, Loader2, Upload } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type GenStatus = "idle" | "generating" | "polling" | "done" | "error";

export default function DashboardVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [motion, setMotion] = useState(127);
  const [fps, setFps] = useState(12);
  const [status, setStatus] = useState<GenStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [genId, setGenId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const onPickFile = useCallback(
    (f: File | null) => {
      resetPreview();
      setFile(f);
      setOutputUrl(null);
      setError(null);
      setGenId(null);
      if (f) setPreviewUrl(URL.createObjectURL(f));
    },
    [resetPreview]
  );

  const pollUntilDone = useCallback(async (id: number) => {
    const supabase = createSupabaseBrowserClient();
    for (let i = 0; i < 120; i++) {
      const res = await fetch(`/api/generations/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Status check failed");
      const data = (await res.json()) as {
        status: string;
        output_url: string | null;
      };
      if (data.status === "completed" && data.output_url) {
        void supabase.auth.refreshSession();
        return data.output_url;
      }
      if (data.status === "failed") throw new Error("Generation failed");
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Timed out waiting for video");
  }, []);

  const onGenerate = useCallback(async () => {
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setError(null);
    setOutputUrl(null);
    setGenId(null);
    setStatus("generating");

    try {
      const form = new FormData();
      form.set("image", file);
      form.set("motion_bucket_id", String(motion));
      form.set("fps", String(fps));

      const res = await fetch("/api/generations/video", {
        method: "POST",
        body: form,
        credentials: "include"
      });
      const data = (await res.json()) as {
        error?: string;
        id?: number;
        status?: string;
        output_url?: string | null;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      const id = data.id;
      if (id == null) throw new Error("Missing generation id");
      setGenId(id);

      if (data.status === "completed" && data.output_url) {
        setOutputUrl(data.output_url);
        setStatus("done");
        return;
      }

      setStatus("polling");
      const url = await pollUntilDone(id);
      setOutputUrl(url);
      setStatus("done");
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [file, motion, fps, pollUntilDone]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0a0a0f] text-white">
      <header className="border-b border-violet-500/15 bg-zinc-950/80 px-4 py-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-200">
            <Clapperboard className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">Video from image</h1>
            <p className="text-sm text-zinc-400">
              Stable Video Diffusion — motion and timing controls
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 p-4 md:grid-cols-2 md:p-8">
        <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-violet-200">
            <Upload className="size-4" />
            Source image
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.06] px-4 py-8 text-sm text-zinc-400 transition-colors hover:border-violet-400/50 hover:bg-violet-500/10"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user upload preview
              <img
                src={previewUrl}
                alt=""
                className="max-h-40 max-w-full rounded-lg object-contain"
              />
            ) : (
              <>
                <Film className="size-8 text-violet-400/70" />
                <span>Click to upload an image</span>
              </>
            )}
          </button>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <label htmlFor="motion">Motion intensity</label>
              <span className="tabular-nums text-violet-300">{motion}</span>
            </div>
            <input
              id="motion"
              type="range"
              min={1}
              max={255}
              value={motion}
              onChange={(e) => setMotion(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-violet-500"
            />
            <p className="mt-1 text-[11px] text-zinc-500">Higher values add more camera / subject motion.</p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <label htmlFor="fps">Output pacing (fps hint)</label>
              <span className="tabular-nums text-violet-300">{fps}</span>
            </div>
            <input
              id="fps"
              type="range"
              min={6}
              max={30}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-fuchsia-500"
            />
            <p className="mt-1 text-[11px] text-zinc-500">Influences decoded frame span for the model.</p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            disabled={!file || status === "generating" || status === "polling"}
            onClick={() => void onGenerate()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-opacity",
              (!file || status === "generating" || status === "polling") && "cursor-not-allowed opacity-50"
            )}
          >
            {status === "generating" || status === "polling" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {status === "polling" ? "Rendering video…" : "Starting…"}
              </>
            ) : (
              <>
                <Clapperboard className="size-4" />
                Generate video
              </>
            )}
          </button>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <h2 className="text-sm font-semibold text-violet-200">Preview</h2>
          <div className="flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
            {outputUrl ? (
              <video
                src={outputUrl}
                controls
                playsInline
                className="max-h-[360px] w-full object-contain"
              />
            ) : (
              <p className="px-4 text-center text-sm text-zinc-500">
                Generated video will appear here. Jobs can take a minute or two.
              </p>
            )}
          </div>
          {genId != null ? (
            <p className="text-center text-xs text-zinc-500">Generation #{genId}</p>
          ) : null}
          {outputUrl ? (
            <a
              href={outputUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-100 hover:bg-violet-500/20"
            >
              <Download className="size-4" />
              Download video
            </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}
