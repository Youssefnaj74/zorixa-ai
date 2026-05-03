"use client";

import { cn } from "@/lib/utils";

export function MotionSlider({
  value,
  onChange,
  className
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const fill = `linear-gradient(to right, #8338eb 0%, #8338eb ${value}%, #1a1a24 ${value}%, #1a1a24 100%)`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zorixa-muted">
          Motion strength
        </span>
        <span className="font-medium tabular-nums text-brand">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full outline-none ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0",
          "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-[0_0_14px_rgba(131,56,235,0.65)]",
          "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:shadow-[0_0_14px_rgba(131,56,235,0.65)]"
        )}
        style={{ background: fill }}
      />
    </div>
  );
}
