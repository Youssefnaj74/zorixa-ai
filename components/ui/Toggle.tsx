"use client";

import * as Switch from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onCheckedChange,
  id,
  disabled,
  label,
  className
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {label ? (
        <label htmlFor={id} className="text-sm text-white/80">
          {label}
        </label>
      ) : null}
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 bg-zorixa-bg-secondary outline-none transition-colors",
          "data-[state=checked]:border-brand/40 data-[state=checked]:bg-brand/30",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:ring-2 focus-visible:ring-brand/50"
        )}
      >
        <Switch.Thumb
          className={cn(
            "block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform will-change-transform",
            "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-brand-light"
          )}
        />
      </Switch.Root>
    </div>
  );
}
