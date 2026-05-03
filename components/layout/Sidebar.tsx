"use client";

import { ModelDropdown } from "@/components/ui/ModelDropdown";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const CAMERA_STYLES = ["None", "iPhone Selfie", "Mirror Selfie", "Top Down View", "Full Bodyshot"] as const;
const RESOLUTIONS = ["2K", "4K", "1K"] as const;
const ASPECTS = ["Auto", "1:1", "16:9", "9:16", "4:3"] as const;

export function Sidebar({
  variant = "image",
  modelId,
  onModelChange,
  cameraStyle,
  onCameraStyleChange,
  resolution,
  onResolutionChange,
  aspect,
  onAspectChange,
  webSearch,
  onWebSearchChange,
  crispUpscale,
  onCrispUpscaleChange,
  creditsLabel = "~90.00 CR",
  loading,
  onGenerate,
  durationSec,
  onDurationChange,
  fps,
  onFpsChange,
  motion,
  onMotionChange,
  className
}: {
  variant?: "image" | "video";
  modelId: string;
  onModelChange: (id: string) => void;
  cameraStyle: string;
  onCameraStyleChange: (v: string) => void;
  resolution: string;
  onResolutionChange: (v: string) => void;
  aspect: string;
  onAspectChange: (v: string) => void;
  webSearch: boolean;
  onWebSearchChange: (v: boolean) => void;
  crispUpscale: boolean;
  onCrispUpscaleChange: (v: boolean) => void;
  creditsLabel?: string;
  loading?: boolean;
  onGenerate: () => void;
  durationSec?: number;
  onDurationChange?: (v: number) => void;
  fps?: number;
  onFpsChange?: (v: number) => void;
  motion?: number;
  onMotionChange?: (v: number) => void;
  className?: string;
}) {
  function Select({
    value,
    onChange,
    options,
    id
  }: {
    value: string;
    onChange: (v: string) => void;
    options: readonly string[];
    id: string;
  }) {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="zorixa-card-border w-full rounded-xl bg-zorixa-card px-3 py-2 text-sm text-white outline-none ring-0 focus:border-brand/40 focus:ring-2 focus:ring-brand/30"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-zorixa-bg">
            {o}
          </option>
        ))}
      </select>
    );
  }

  const sectionLabel = "mb-1 text-xs font-semibold uppercase tracking-wider text-zorixa-muted";

  return (
    <aside
      className={cn(
        "zorixa-card-border flex h-full min-h-0 max-h-full w-full max-w-[340px] shrink-0 flex-col rounded-2xl bg-zorixa-card p-3 shadow-glow transition-shadow hover:shadow-glow-lg lg:w-80",
        className
      )}
    >
      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden">
        <div>
          <p className={sectionLabel}>Camera Style</p>
          <Select
            id="camera-style"
            value={cameraStyle}
            onChange={onCameraStyleChange}
            options={CAMERA_STYLES}
          />
        </div>

        <div>
          <p className={sectionLabel}>Model</p>
          <ModelDropdown value={modelId} onChange={onModelChange} />
          <p className="mt-1.5 text-[11px] leading-snug text-zorixa-muted">
            Selected plan includes <Badge variant="fullAccess">FULL ACCESS</Badge> for Nano Banana 2.
          </p>
        </div>

        <div>
          <p className={sectionLabel}>Resolution</p>
          <Select id="resolution" value={resolution} onChange={onResolutionChange} options={RESOLUTIONS} />
        </div>

        <div>
          <p className={sectionLabel}>Aspect ratio</p>
          <Select id="aspect" value={aspect} onChange={onAspectChange} options={ASPECTS} />
        </div>

        {variant === "video" ? (
          <>
            <div>
              <p className={sectionLabel}>Duration</p>
              <Select
                id="duration"
                value={String(durationSec ?? 5)}
                onChange={(v) => onDurationChange?.(Number(v))}
                options={["3", "5", "10", "15"]}
              />
            </div>
            <div>
              <p className={sectionLabel}>FPS</p>
              <Select
                id="fps"
                value={String(fps ?? 24)}
                onChange={(v) => onFpsChange?.(Number(v))}
                options={["24", "30", "60"]}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zorixa-muted">
                  Motion strength
                </span>
                <span className="text-xs tabular-nums text-brand-light">{motion ?? 50}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={motion ?? 50}
                onChange={(e) => onMotionChange?.(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-brand"
              />
            </div>
          </>
        ) : null}

        <Toggle id="web-search" label="Web Search" checked={webSearch} onCheckedChange={onWebSearchChange} />

        {variant === "video" ? (
          <Toggle id="crisp" label="Crisp Upscale" checked={crispUpscale} onCheckedChange={onCrispUpscaleChange} />
        ) : null}
      </div>

      {variant === "video" ? (
        <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-white/10 pt-3">
          <div className="zorixa-card-border rounded-xl bg-zorixa-bg-secondary px-3 py-1.5 text-sm">
            <span className="text-zorixa-muted">Credits </span>
            <span className="font-semibold tabular-nums text-white">{creditsLabel}</span>
          </div>
          <GenerateButton loading={loading} creditsLabel={creditsLabel} onClick={onGenerate} />
        </div>
      ) : null}
    </aside>
  );
}
