export const DIRECTOR_STYLE_OPTIONS = [
  "auto",
  "cinematic",
  "ugc",
  "product",
  "anime"
] as const;

export type DirectorStyleInput = (typeof DIRECTOR_STYLE_OPTIONS)[number];

export type DirectorResolvedStyle = Exclude<DirectorStyleInput, "auto">;

export const DIRECTOR_QUALITY_PRESETS = ["fast", "balanced", "best"] as const;

export type DirectorQualityPreset = (typeof DIRECTOR_QUALITY_PRESETS)[number];

export type DirectorRouteAction = "text" | "image";

export type DirectorModelSlot = {
  primary: string;
  fallbacks: string[];
};

export type DirectorStyleConfig = {
  label: string;
  textToVideo: DirectorModelSlot;
  imageToVideo: DirectorModelSlot;
};

export type DirectorModelInfo = {
  summary: string;
  whyBullets: string[];
};

export type DirectorQualityPresetConfig = {
  label: string;
  /** Output resolution tier for this preset (Fast = 480p, Balanced/Best = 720p). */
  resolution?: string;
  useStylePrimary?: boolean;
  byStyle?: Partial<Record<DirectorResolvedStyle, string>>;
  default?: string;
};

export type DirectorExample = {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
  style: DirectorResolvedStyle;
  /** Suggested clip length when this example is selected (UGC/product → 8s). */
  defaultDurationSec?: number;
};

export type DirectorRoutingConfig = {
  version: number;
  styles: Record<DirectorResolvedStyle, DirectorStyleConfig>;
  qualityPresets: Record<DirectorQualityPreset, DirectorQualityPresetConfig>;
  models: Record<string, DirectorModelInfo>;
  directorExamples: DirectorExample[];
  autoDetection: Record<DirectorResolvedStyle, string[]>;
  autoDefaultStyle: DirectorResolvedStyle;
};

export type DirectorRouteResult = {
  styleRequested: DirectorStyleInput;
  styleResolved: DirectorResolvedStyle;
  qualityPreset: DirectorQualityPreset;
  stylePrimaryModelId: string;
  modelId: string;
  fallbackModelIds: string[];
  modelChain: string[];
  routeAction: DirectorRouteAction;
  actionTab: "Text to Video" | "Image to Video";
  resolution: string;
  modelSummary: string;
  whyBullets: string[];
};

export type DirectorRunMetadata = {
  style_requested: DirectorStyleInput;
  style_resolved: DirectorResolvedStyle;
  routed_model: string;
  route_action: DirectorRouteAction;
  prompt: string;
  success: boolean;
  prediction_id?: string | null;
  output_url?: string | null;
  credits_spent?: number;
  user_liked?: boolean;
  user_downloaded?: boolean;
};
