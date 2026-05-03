"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function PromptBar({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  showNegative,
  onToggleNegative,
  placeholder = "Describe what you want to generate…",
  leading
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (v: string) => void;
  showNegative: boolean;
  onToggleNegative: () => void;
  placeholder?: string;
  /** Optional upload / attachments row above the prompt (e.g. image reference). */
  leading?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="border-b border-[rgba(131,56,235,0.15)] bg-zorixa-bg-secondary/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3">
        {leading ? <div className="w-full">{leading}</div> : null}
        <div
          className={cn(
            "rounded-xl border bg-zorixa-card px-3 py-2 transition-shadow",
            focused
              ? "border-transparent shadow-[0_0_0_2px_rgba(131,56,235,0.45),0_0_24px_rgba(37,99,235,0.15)]"
              : "zorixa-card-border shadow-none"
          )}
        >
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={2}
            className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zorixa-muted"
          />
        </div>

        <button
          type="button"
          onClick={onToggleNegative}
          className="flex w-fit items-center gap-2 text-xs font-medium text-zorixa-muted hover:text-white"
        >
          Negative prompt
          {showNegative ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {showNegative ? (
          <div className="zorixa-card-border rounded-xl bg-zorixa-card px-3 py-2">
            <textarea
              value={negativePrompt}
              onChange={(e) => onNegativePromptChange(e.target.value)}
              placeholder="Things to avoid…"
              rows={2}
              className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-zorixa-muted"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
