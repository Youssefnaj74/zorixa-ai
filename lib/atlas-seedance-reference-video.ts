/** Atlas Seedance 2.0 reference-to-video — request helpers. */

const R2V_RATIOS = new Set(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]);

export function isSeedanceReferenceToVideoModel(model: string): boolean {
  return /seedance/i.test(model) && /reference-to-video/i.test(model);
}

/** Atlas R2V accepts 4–15 seconds (or -1 auto; we send explicit 4–15). */
export function normalizeSeedanceReferenceDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(15, Math.max(4, Math.round(raw)));
}

/** UI aspect label → Atlas `ratio` param. */
export function uiAspectToAtlasRatio(aspectRatio: string): string {
  const v = aspectRatio.trim();
  return R2V_RATIOS.has(v) ? v : "9:16";
}
