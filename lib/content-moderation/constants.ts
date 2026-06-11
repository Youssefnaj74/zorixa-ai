export const CONTENT_POLICY_VIOLATION_MESSAGE =
  "This request violates ZorixaAI Content Policy.";

export const CONTENT_POLICY_VIOLATION_CODE = "CONTENT_POLICY_VIOLATION";

export type ModerationCategory =
  | "nsfw"
  | "pornography"
  | "nudity"
  | "sexual_content"
  | "child_exploitation"
  | "deepfake_impersonation"
  | "illegal_content";

export type ModerationWorkflow =
  | "image_generation"
  | "video_generation"
  | "ugc_generation"
  | "character_swap"
  | "image_enhance"
  | "legacy_video";

export const MODERATION_CATEGORY_LABELS: Record<ModerationCategory, string> = {
  nsfw: "NSFW",
  pornography: "Pornography",
  nudity: "Nudity",
  sexual_content: "Sexual content",
  child_exploitation: "Child exploitation",
  deepfake_impersonation: "Deepfake / impersonation",
  illegal_content: "Illegal content"
};
