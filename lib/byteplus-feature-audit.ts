/**
 * BytePlus Seedance 2.0 — studio option compatibility audit (static reference).
 * Used by the admin dashboard audit report; does not change runtime behavior.
 */

export type FeatureSupportLevel =
  | "native"
  | "converted"
  | "ignored"
  | "atlas_fallback";

export type FeatureAuditRow = {
  option: string;
  value: string;
  level: FeatureSupportLevel;
  notes: string;
};

export const BYTEPLUS_SEEDANCE_FEATURE_AUDIT: FeatureAuditRow[] = [
  {
    option: "Resolution",
    value: "480p",
    level: "converted",
    notes: "UI 480p is sent to BytePlus as 720p (normalizeBytePlusSeedanceResolution)."
  },
  {
    option: "Resolution",
    value: "720p",
    level: "native",
    notes: "Supported natively."
  },
  {
    option: "Resolution",
    value: "1080p",
    level: "native",
    notes: "Supported natively."
  },
  {
    option: "Resolution",
    value: "4k",
    level: "atlas_fallback",
    notes: "4K always routes to Atlas Cloud (Seedance pixel presets). BytePlus serves 720p/1080p on Standard tier."
  },
  {
    option: "Aspect Ratio",
    value: "16:9",
    level: "native",
    notes: "Sent as ratio param."
  },
  {
    option: "Aspect Ratio",
    value: "9:16",
    level: "native",
    notes: "Sent as ratio param; T2V also gets prompt aspect hint."
  },
  {
    option: "Aspect Ratio",
    value: "1:1",
    level: "native",
    notes: "Sent as ratio param."
  },
  {
    option: "Aspect Ratio",
    value: "4:3",
    level: "native",
    notes: "Sent as ratio param."
  },
  {
    option: "Aspect Ratio",
    value: "3:4",
    level: "native",
    notes: "Sent as ratio param via uiAspectToAtlasRatio."
  },
  {
    option: "Duration",
    value: "5–15s",
    level: "native",
    notes: "Clamped to BytePlus 4–15s window."
  },
  {
    option: "Duration",
    value: "1–3s",
    level: "converted",
    notes: "UI values below 4s are clamped up to 4s minimum."
  },
  {
    option: "Soundtrack",
    value: "ON",
    level: "native",
    notes: "generate_audio: true in BytePlus request."
  },
  {
    option: "Soundtrack",
    value: "OFF",
    level: "native",
    notes: "generate_audio: false in BytePlus request."
  },
  {
    option: "Text to Video",
    value: "—",
    level: "native",
    notes: "content[] text item."
  },
  {
    option: "Image to Video",
    value: "—",
    level: "native",
    notes: "first_frame role; optional last_frame for end frame."
  },
  {
    option: "Reference to Video",
    value: "—",
    level: "native",
    notes: "reference_image / reference_video / reference_audio roles + @tokens in prompt."
  },
  {
    option: "Reference Image",
    value: "up to 9",
    level: "native",
    notes: "reference_image role per URL."
  },
  {
    option: "Reference Video",
    value: "up to 3",
    level: "native",
    notes: "reference_video role; public HTTPS URLs only."
  },
  {
    option: "Reference Audio",
    value: "up to 3",
    level: "native",
    notes: "reference_audio role; must accompany image or video ref."
  },
  {
    option: "Video Edit",
    value: "—",
    level: "native",
    notes: "action=edit with source video + reference images (backend); UI currently routes V2V to Wan/HappyHorse."
  },
  {
    option: "Video Extend",
    value: "—",
    level: "native",
    notes: "action=edit with source video only; UI Extend button switches to Wan 2.7 today."
  },
  {
    option: "Speed Tier Fast",
    value: "—",
    level: "atlas_fallback",
    notes: "Fast tier always uses Atlas Cloud (by design)."
  },
  {
    option: "Seedance 1.5",
    value: "—",
    level: "atlas_fallback",
    notes: "Not routed to BytePlus."
  },
  {
    option: "Atlas width/height swap",
    value: "T2V 9:16",
    level: "ignored",
    notes: "BytePlus uses ratio param instead of Atlas pixel-swap workaround."
  }
];

export type ProductionAuditAnswer = {
  question: string;
  answer: "yes" | "partial" | "no";
  detail: string;
};

export function buildBytePlusProductionAuditReport(): ProductionAuditAnswer[] {
  return [
    {
      question: "Are Resolution options fully supported by BytePlus?",
      answer: "partial",
      detail:
        "720p and 1080p are native on BytePlus Standard tier. 480p is converted to 720p. 4K is Atlas-only in production routing."
    },
    {
      question: "Are Aspect Ratios fully supported?",
      answer: "yes",
      detail: "16:9, 9:16, 1:1, 4:3, and 3:4 are passed as BytePlus ratio values."
    },
    {
      question: "Does Soundtrack work?",
      answer: "yes",
      detail: "generate_audio is set explicitly from the studio Audio toggle."
    },
    {
      question: "Does Text-to-Video work?",
      answer: "yes",
      detail: "Standard-tier Seedance 2.0 T2V routes to BytePlus with text content item."
    },
    {
      question: "Does Image-to-Video work?",
      answer: "yes",
      detail: "first_frame and optional last_frame roles; Atlas fallback on failure."
    },
    {
      question: "Does Reference-to-Video work?",
      answer: "yes",
      detail: "Multimodal reference roles with @image/@video/@audio prompt tokens."
    },
    {
      question: "Is profitability still correct?",
      answer: "yes",
      detail:
        "User credits unchanged (existing creditsForVideoModel). Revenue = credits × $0.01. Provider cost uses BytePlus wholesale estimates or Atlas wholesale when Atlas serves the job."
    },
    {
      question: "Are credits unchanged?",
      answer: "yes",
      detail: "No changes to credits-charge.ts or creditsChargedForVideoModel formulas."
    },
    {
      question: "Does automatic fallback work?",
      answer: "yes",
      detail:
        "BytePlus create failures and immediate task failures fall through to Atlas on the same credit charge; fallback events are logged in generation_economics."
    },
    {
      question: "Is BytePlus ready for production?",
      answer: "partial",
      detail:
        "Core T2V/I2V/R2V paths are production-ready with fallback. Video Edit/Extend are API-ready but not exposed in the Seedance studio UI. Monitor economics dashboard for real margin vs estimates."
    }
  ];
}
