/**
 * Alibaba Wan 2.6 — text / image / video-to-video on Atlas Cloud.
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.6/text-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.6/image-to-video
 * @see https://www.atlascloud.ai/models/alibaba/wan-2.6/video-to-video
 */

export const WAN_26_COMPOSER_ID = "wan-2-6" as const;

export const WAN_26_SHOT_TYPES = ["single", "multi"] as const;

export type Wan26ShotType = (typeof WAN_26_SHOT_TYPES)[number];

export function isWan26ComposerId(id: string): boolean {
  return id === WAN_26_COMPOSER_ID;
}

export function isWan26AtlasModel(model: string): boolean {
  return /alibaba\/wan-2\.6\/(text-to-video|image-to-video|video-to-video)/i.test(model);
}

export function normalizeWan26ShotType(raw: unknown): Wan26ShotType {
  if (typeof raw === "string" && raw.trim().toLowerCase() === "multi") {
    return "multi";
  }
  return "single";
}

/** T2V / I2V / V2V tabs when Wan 2.6 is selected. */
export function wan26ComposerSupportsShotType(
  composerModelId: string,
  actionTab: string
): boolean {
  if (!isWan26ComposerId(composerModelId)) return false;
  return (
    actionTab === "Text to Video" ||
    actionTab === "Image to Video" ||
    actionTab === "Video to Video"
  );
}

/**
 * Atlas `shot_type`: single (default) or multi.
 * Multi-shot requires `enable_prompt_expansion: true` on Atlas.
 */
export function applyWan26ShotTypeFields(
  body: Record<string, unknown>,
  shotType: Wan26ShotType
): void {
  body.shot_type = shotType;
  if (shotType === "multi") {
    body.enable_prompt_expansion = true;
  }
}
