import type { ActionTab } from "@/components/video/ActionTabsRow";
import a2vRecipes from "@/data/video-a2v-showcase-recipes.json";
import i2vRecipes from "@/data/video-i2v-showcase-recipes.json";
import t2vRecipes from "@/data/video-t2v-showcase-recipes.json";
import v2vRecipes from "@/data/video-v2v-showcase-recipes.json";
import {
  videoA2vShowcaseAudioPath,
  videoA2vShowcaseOutputPath,
  videoA2vShowcasePortraitPath,
  videoA2vShowcasePosterPath
} from "@/lib/video-a2v-showcase-paths";
import {
  videoI2vShowcaseOutputPath,
  videoI2vShowcasePosterPath,
  videoI2vShowcaseStartFramePath
} from "@/lib/video-i2v-showcase-paths";
import {
  videoT2vShowcaseOutputPath,
  videoT2vShowcasePosterPath
} from "@/lib/video-t2v-showcase-paths";
import {
  videoV2vShowcaseCharacterPath,
  videoV2vShowcaseMotionClipPath,
  videoV2vShowcaseOutputPath,
  videoV2vShowcasePosterPath
} from "@/lib/video-v2v-showcase-paths";

export type VideoModelShowcase = {
  modelId: string;
  actionTab: ActionTab;
  prompt: string;
  timeSeconds: number;
  aspect: string;
  resolution: string;
  durationStandard: string;
  videoUrl: string;
  posterUrl: string;
  historyTitle: string;
  /** Image to Video — per-model start frame. */
  startFrameImageUrl?: string;
  /** Audio to Video — portrait input. */
  portraitImageUrl?: string;
  /** Audio to Video — audio input. */
  audioUrl?: string;
  /** Video to Video — character still (motion control). */
  characterImageUrl?: string;
  /** Video to Video — reference motion clip. */
  motionClipUrl?: string;
  /** Video to Video — Kling motion framing. */
  characterOrientation?: "image" | "video";
  keepOriginalSound?: boolean;
};

type VideoRecipe = {
  prompt: string;
  historyTitle: string;
  startFramePrompt?: string;
  timeSeconds?: number;
  aspect?: string;
  resolution?: string;
  durationStandard?: string;
};

const T2V_DEFAULTS = t2vRecipes.defaults as {
  timeSeconds: number;
  aspect: string;
  resolution: string;
  durationStandard: string;
};

const I2V_DEFAULTS = i2vRecipes.defaults as {
  timeSeconds: number;
  aspect: string;
  resolution: string;
  durationStandard: string;
};

const T2V_RECIPES = t2vRecipes.models as Record<string, VideoRecipe>;
const I2V_RECIPES = i2vRecipes.models as Record<string, VideoRecipe>;

const A2V_DEFAULTS = a2vRecipes.defaults as {
  timeSeconds: number;
  aspect: string;
  resolution: string;
  durationStandard: string;
  prompt: string;
};

const A2V_RECIPES = a2vRecipes.models as Record<string, VideoRecipe>;

type V2vRecipe = VideoRecipe & {
  characterOrientation?: "image" | "video";
  keepOriginalSound?: boolean;
};

const V2V_DEFAULTS = v2vRecipes.defaults as {
  aspect: string;
  resolution: string;
  durationStandard: string;
  characterOrientation: "image" | "video";
  keepOriginalSound: boolean;
  prompt: string;
};

const V2V_RECIPES = v2vRecipes.models as Record<string, V2vRecipe>;

export function showcaseVideoAssetUrl(path: string, origin = ""): string {
  const p = path.trim();
  if (!p) return p;
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("blob:")) return p;
  if (p.startsWith("/") && origin) return `${origin.replace(/\/$/, "")}${p}`;
  return p;
}

function buildT2vShowcase(composerModelId: string): VideoModelShowcase | null {
  const recipe = T2V_RECIPES[composerModelId];
  if (!recipe?.prompt?.trim()) return null;

  return {
    modelId: composerModelId,
    actionTab: "Text to Video",
    prompt: recipe.prompt,
    timeSeconds: recipe.timeSeconds ?? T2V_DEFAULTS.timeSeconds,
    aspect: recipe.aspect ?? T2V_DEFAULTS.aspect,
    resolution: recipe.resolution ?? T2V_DEFAULTS.resolution,
    durationStandard: recipe.durationStandard ?? T2V_DEFAULTS.durationStandard,
    videoUrl: videoT2vShowcaseOutputPath(composerModelId),
    posterUrl: videoT2vShowcasePosterPath(composerModelId),
    historyTitle: recipe.historyTitle
  };
}

function buildI2vShowcase(composerModelId: string): VideoModelShowcase | null {
  const recipe = I2V_RECIPES[composerModelId];
  if (!recipe?.prompt?.trim()) return null;

  return {
    modelId: composerModelId,
    actionTab: "Image to Video",
    prompt: recipe.prompt,
    timeSeconds: recipe.timeSeconds ?? I2V_DEFAULTS.timeSeconds,
    aspect: recipe.aspect ?? I2V_DEFAULTS.aspect,
    resolution: recipe.resolution ?? I2V_DEFAULTS.resolution,
    durationStandard: recipe.durationStandard ?? I2V_DEFAULTS.durationStandard,
    videoUrl: videoI2vShowcaseOutputPath(composerModelId),
    posterUrl: videoI2vShowcasePosterPath(composerModelId),
    historyTitle: recipe.historyTitle,
    startFrameImageUrl: videoI2vShowcaseStartFramePath(composerModelId)
  };
}

function buildV2vShowcase(composerModelId: string): VideoModelShowcase | null {
  const recipe = V2V_RECIPES[composerModelId];
  if (!recipe) return null;

  return {
    modelId: composerModelId,
    actionTab: "Video to Video",
    prompt: recipe.prompt != null ? String(recipe.prompt).trim() : V2V_DEFAULTS.prompt,
    timeSeconds: recipe.timeSeconds ?? 5,
    aspect: recipe.aspect ?? V2V_DEFAULTS.aspect,
    resolution: recipe.resolution ?? V2V_DEFAULTS.resolution,
    durationStandard: recipe.durationStandard ?? V2V_DEFAULTS.durationStandard,
    videoUrl: videoV2vShowcaseOutputPath(composerModelId),
    posterUrl: videoV2vShowcasePosterPath(composerModelId),
    historyTitle: recipe.historyTitle,
    characterImageUrl: videoV2vShowcaseCharacterPath(composerModelId),
    motionClipUrl: videoV2vShowcaseMotionClipPath(composerModelId),
    characterOrientation: recipe.characterOrientation ?? V2V_DEFAULTS.characterOrientation,
    keepOriginalSound: recipe.keepOriginalSound ?? V2V_DEFAULTS.keepOriginalSound
  };
}

function buildA2vShowcase(composerModelId: string): VideoModelShowcase | null {
  const recipe = A2V_RECIPES[composerModelId];
  if (!recipe) return null;

  return {
    modelId: composerModelId,
    actionTab: "Audio to Video",
    prompt: recipe.prompt?.trim() || A2V_DEFAULTS.prompt,
    timeSeconds: recipe.timeSeconds ?? A2V_DEFAULTS.timeSeconds,
    aspect: recipe.aspect ?? A2V_DEFAULTS.aspect,
    resolution: recipe.resolution ?? A2V_DEFAULTS.resolution,
    durationStandard: recipe.durationStandard ?? A2V_DEFAULTS.durationStandard,
    videoUrl: videoA2vShowcaseOutputPath(composerModelId),
    posterUrl: videoA2vShowcasePosterPath(composerModelId),
    historyTitle: recipe.historyTitle,
    portraitImageUrl: videoA2vShowcasePortraitPath(composerModelId),
    audioUrl: videoA2vShowcaseAudioPath(composerModelId)
  };
}

/** First-visit studio demo for Text / Image / Audio to Video. */
export function getVideoModelShowcase(
  composerModelId: string,
  actionTab: ActionTab
): VideoModelShowcase | null {
  if (actionTab === "Audio to Video") {
    return buildA2vShowcase(composerModelId);
  }
  if (actionTab === "Image to Video") {
    return buildI2vShowcase(composerModelId);
  }
  if (actionTab === "Text to Video") {
    return buildT2vShowcase(composerModelId);
  }
  if (actionTab === "Video to Video") {
    return buildV2vShowcase(composerModelId);
  }
  return null;
}
