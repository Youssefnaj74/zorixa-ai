import { formatInteger } from "@/lib/format-number";

export type HistoryCreditsTone = "charged" | "free" | "failed";

export function historyCreditsLabel(
  creditsSpent: number | null | undefined,
  status?: string | null
): { label: string; tone: HistoryCreditsTone } {
  const credits = Math.max(0, Math.round(creditsSpent ?? 0));
  const statusNorm = (status ?? "completed").toLowerCase();
  const failed = statusNorm === "failed";

  if (failed) {
    return {
      label: credits > 0 ? `-${formatInteger(credits)} CR (failed)` : "0 CR (failed)",
      tone: "failed"
    };
  }
  if (credits > 0) {
    return { label: `-${formatInteger(credits)} CR`, tone: "charged" };
  }
  return { label: "0 CR", tone: "free" };
}

export function historyCreditsBadgeClass(tone: HistoryCreditsTone): string {
  switch (tone) {
    case "charged":
      return "border-[#00e5ff]/35 bg-black/55 text-[#00e5ff]";
    case "failed":
      return "border-amber-400/40 bg-black/55 text-amber-200";
    default:
      return "border-white/15 bg-black/45 text-white/55";
  }
}
