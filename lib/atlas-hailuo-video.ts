/**
 * MiniMax Hailuo 2.3 on Atlas Cloud — T2V Pro (flat 5s) and I2V Standard (6s / 10s).
 * @see https://www.atlascloud.ai/models/minimax/hailuo-2.3/t2v-pro
 * @see https://www.atlascloud.ai/models/minimax/hailuo-2.3/i2v-standard
 */

export const HAILUO_23_COMPOSER_ID = "hailuo-2-3" as const;

export const HAILUO_23_T2V_PRO_ATLAS = "minimax/hailuo-2.3/t2v-pro";
export const HAILUO_23_I2V_STANDARD_ATLAS = "minimax/hailuo-2.3/i2v-standard";

/** Atlas T2V Pro output is always 5 seconds. */
export const HAILUO_23_T2V_DURATION_SECONDS = 5;

export const HAILUO_23_I2V_DURATION_OPTIONS = [6, 10] as const;

/** Atlas wholesale — T2V Pro flat per run. */
export const HAILUO_23_T2V_PRO_USD = 0.49;

/** Atlas wholesale — I2V Standard per second (1080p fixed). */
export const HAILUO_23_I2V_STANDARD_PER_SECOND_USD = 0.28;

export function isHailuo23ComposerId(id: string): boolean {
  return id === HAILUO_23_COMPOSER_ID;
}

export function isHailuo23AtlasModel(model: string): boolean {
  return /minimax\/hailuo-2\.3\/(t2v-pro|i2v-standard)/i.test(model);
}

export function isHailuo23TextAtlasModel(model: string): boolean {
  return /minimax\/hailuo-2\.3\/t2v-pro/i.test(model);
}

export function isHailuo23ImageAtlasModel(model: string): boolean {
  return /minimax\/hailuo-2\.3\/i2v-standard/i.test(model);
}

export function hailuo23ComposerSupportsAction(id: string, actionTab: string): boolean {
  if (!isHailuo23ComposerId(id)) return true;
  return actionTab === "Text to Video" || actionTab === "Image to Video";
}

export function normalizeHailuo23I2vDurationSeconds(raw: number): number {
  if (!Number.isFinite(raw)) return HAILUO_23_I2V_DURATION_OPTIONS[0];
  const rounded = Math.round(raw);
  if (rounded >= 8) return 10;
  return 6;
}

export function hailuo23AtlasUsdForOptions(
  opts: { routeAction?: string; durationSeconds?: number } = {}
): number {
  if (opts.routeAction === "image") {
    const duration = normalizeHailuo23I2vDurationSeconds(opts.durationSeconds ?? 6);
    return HAILUO_23_I2V_STANDARD_PER_SECOND_USD * duration;
  }
  return HAILUO_23_T2V_PRO_USD;
}

export function buildHailuo23AtlasBody(input: {
  model: string;
  prompt: string;
  durationSec?: number;
  imageUrl?: string;
  enablePromptExpansion?: boolean;
}): Record<string, unknown> {
  const isI2v = isHailuo23ImageAtlasModel(input.model);
  const body: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt,
    enable_prompt_expansion: input.enablePromptExpansion ?? !isI2v
  };

  if (isI2v) {
    body.duration = normalizeHailuo23I2vDurationSeconds(input.durationSec ?? 6);
    if (input.imageUrl) {
      body.image = input.imageUrl;
    }
  }

  return body;
}
