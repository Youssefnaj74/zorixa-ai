/**
 * MiniMax direct PAYG wholesale for Hailuo 2.3 (USD per generated clip).
 * @see https://platform.minimax.io/docs/guides/pricing-paygo
 */

export const MINIMAX_HAILUO_23_USD = {
  "768P_6s": 0.28,
  "768P_10s": 0.56,
  "1080P_6s": 0.49
} as const;

export type MinimaxHailuoPricingOptions = {
  routeAction?: string;
  durationSeconds?: number;
  resolution?: string;
};

function normalizeRes(raw: string | undefined): "768P" | "1080P" {
  const v = (raw ?? "").trim().toUpperCase();
  if (v === "768P" || v === "768") return "768P";
  return "1080P";
}

function normalizeDuration(raw: number | undefined, resolution: "768P" | "1080P"): 6 | 10 {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 6;
  const rounded = Math.round(raw);
  if (resolution === "1080P") return 6;
  return rounded >= 8 ? 10 : 6;
}

/** Wholesale USD for one MiniMax Hailuo 2.3 generation. */
export function minimaxHailuo23UsdForOptions(opts: MinimaxHailuoPricingOptions = {}): number {
  // T2V default path: 1080P / 6s when duration looks like Atlas's fixed 5s.
  const action = (opts.routeAction ?? "text").toLowerCase();
  let resolution = normalizeRes(opts.resolution);
  let duration = normalizeDuration(opts.durationSeconds, resolution);

  if (action === "text") {
    const raw = opts.durationSeconds;
    if (typeof raw === "number" && Number.isFinite(raw) && Math.round(raw) >= 8) {
      resolution = "768P";
      duration = 10;
    } else {
      // Atlas UI sends 5s for T2V; MiniMax runs 1080P / 6s.
      resolution = "1080P";
      duration = 6;
    }
  } else if (action === "image") {
    const raw = opts.durationSeconds;
    if (typeof raw === "number" && Number.isFinite(raw) && Math.round(raw) >= 8) {
      resolution = "768P";
      duration = 10;
    } else {
      resolution = "1080P";
      duration = 6;
    }
  }

  if (resolution === "1080P") return MINIMAX_HAILUO_23_USD["1080P_6s"];
  return duration === 10
    ? MINIMAX_HAILUO_23_USD["768P_10s"]
    : MINIMAX_HAILUO_23_USD["768P_6s"];
}
