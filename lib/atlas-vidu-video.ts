/** Atlas Vidu Q3 / Q3-Pro video helpers. */

/** Reference-to-Video tab — Atlas `vidu/q3/reference-to-video`. */
export const VIDU_Q3_COMPOSER_ID = "vidu-q3" as const;

/** T2V, I2V, Start-End — Atlas `vidu/q3-pro/*` (+ turbo via speed tier). */
export const VIDU_Q3_PRO_COMPOSER_ID = "vidu-q3-pro" as const;

export function isViduQ3ComposerId(composerModelId: string): boolean {
  return composerModelId === VIDU_Q3_COMPOSER_ID;
}

export function isViduQ3ProComposerId(composerModelId: string): boolean {
  return composerModelId === VIDU_Q3_PRO_COMPOSER_ID;
}

export function isViduReferenceComposerId(composerModelId: string): boolean {
  return isViduQ3ComposerId(composerModelId);
}

export function isViduAtlasModelSlug(model: string): boolean {
  return /vidu/i.test(model);
}

export function isViduReferenceToVideoModel(model: string): boolean {
  return isViduAtlasModelSlug(model) && /reference-to-video/i.test(model);
}

export function isViduStartEndToVideoModel(model: string): boolean {
  return isViduAtlasModelSlug(model) && /start-end-to-video/i.test(model);
}

/** Atlas Vidu Q3-Pro accepts 1–16 seconds. */
export function normalizeViduDurationSeconds(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 5;
  return Math.min(16, Math.max(1, Math.round(raw)));
}
