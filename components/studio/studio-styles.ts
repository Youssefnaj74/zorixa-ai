import { cn } from "@/lib/utils";

/** Shared Enhancor studio tokens (Tailwind: studio.canvas, studio.line, studio.accent) */

export const studioField = () =>
  cn(
    "rounded-xl border border-studio-line bg-black/50 px-3.5 py-2.5 font-body text-sm text-white shadow-inner shadow-black/40 outline-none transition-colors",
    "placeholder:text-white/35 focus:border-studio-accent/50 focus:ring-1 focus:ring-studio-accent/20"
  );

export const studioSection = "font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45";

/** Selected pill / tab — purple ring only, no full-panel glow */
export const studioOptionActive =
  "border-studio-accent bg-studio-accent/10 text-white ring-1 ring-studio-accent/35";

export const studioOptionIdle =
  "border-studio-line bg-black/40 text-white/55 hover:border-white/12 hover:text-white/90";

/** Card surfaces inside the left rail */
export const studioCard = "rounded-2xl border border-studio-line bg-black/35";
