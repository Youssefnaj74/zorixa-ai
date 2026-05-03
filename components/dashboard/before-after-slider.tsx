"use client";

import { useMemo, useState } from "react";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl
}: {
  beforeUrl: string;
  afterUrl: string;
}) {
  const [value, setValue] = useState(50);
  const clip = useMemo(() => `inset(0 ${100 - value}% 0 0)`, [value]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <img src={beforeUrl} alt="Before" className="block h-auto w-full" />
      <img
        src={afterUrl}
        alt="After"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: clip }}
      />

      <div className="pointer-events-none absolute inset-y-0 left-0 w-full">
        <div
          className="absolute inset-y-0 w-px bg-white/70"
          style={{ left: `${value}%` }}
        />
      </div>

      <div className="absolute inset-x-4 bottom-4">
        <input
          aria-label="Before after slider"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-violet-400"
        />
        <div className="mt-2 flex justify-between text-xs text-zinc-300">
          <span>Before</span>
          <span>After</span>
        </div>
      </div>
    </div>
  );
}

