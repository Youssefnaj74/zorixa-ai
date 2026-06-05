import type { ImageActionTab } from "@/components/image/ImageActionTabsRow";
import type { ImageCameraStyle } from "@/lib/image-camera-style-prompt";
import i2iRecipes from "@/data/image-i2i-showcase-recipes.json";
import t2iRecipes from "@/data/image-t2i-showcase-recipes.json";
import {
  I2I_SHOWCASE_SHARED_REFERENCE,
  I2I_SHOWCASE_SHARED_STYLE,
  i2iShowcaseOutputPath
} from "@/lib/image-i2i-showcase-paths";
import { imageT2iShowcaseOutputPath } from "@/lib/image-t2i-showcase-paths";
import { imageI2iUsesStyleSlot } from "@/lib/image-i2i-model-slots";

export type ImageModelShowcase = {
  modelId: string;
  prompt: string;
  cameraStyle: ImageCameraStyle;
  resolution: string;
  aspect: string;
  imageUrl: string;
  historyTitle: string;
  actionTab: ImageActionTab;
  /** Image-to-Image: Reference + optional Style slots in the bottom bar. */
  referenceImageUrl?: string;
  styleImageUrl?: string;
};

type T2iRecipe = {
  prompt: string;
  historyTitle: string;
  cameraStyle?: string;
  resolution?: string;
  aspect?: string;
};

type I2iRecipe = {
  editPrompt: string;
  historyTitle: string;
  cameraStyle?: string;
  resolution?: string;
  aspect?: string;
};

const T2I_DEFAULTS = t2iRecipes.defaults as {
  cameraStyle: string;
  resolution: string;
  aspect: string;
};

function buildT2iShowcases(): Partial<Record<string, ImageModelShowcase>> {
  const out: Partial<Record<string, ImageModelShowcase>> = {};
  const models = t2iRecipes.models as Record<string, T2iRecipe>;

  for (const [modelId, recipe] of Object.entries(models)) {
    if (!recipe.prompt?.trim()) continue;
    out[modelId] = {
      modelId,
      prompt: recipe.prompt,
      cameraStyle: (recipe.cameraStyle ?? T2I_DEFAULTS.cameraStyle) as ImageCameraStyle,
      resolution: recipe.resolution ?? T2I_DEFAULTS.resolution,
      aspect: recipe.aspect ?? T2I_DEFAULTS.aspect,
      imageUrl: imageT2iShowcaseOutputPath(modelId),
      historyTitle: recipe.historyTitle,
      actionTab: "Text to Image"
    };
  }
  return out;
}

function buildI2iShowcases(): Partial<Record<string, ImageModelShowcase>> {
  const out: Partial<Record<string, ImageModelShowcase>> = {};
  const models = i2iRecipes.models as Record<string, I2iRecipe>;
  const defaults = (i2iRecipes as { defaults?: { cameraStyle: string; resolution: string; aspect: string } })
    .defaults ?? { cameraStyle: "None", resolution: "2K", aspect: "Auto" };

  for (const [modelId, recipe] of Object.entries(models)) {
    if (!recipe.editPrompt?.trim()) continue;
    out[modelId] = {
      modelId,
      prompt: recipe.editPrompt,
      cameraStyle: (recipe.cameraStyle ?? defaults.cameraStyle) as ImageCameraStyle,
      resolution: recipe.resolution ?? defaults.resolution,
      aspect: recipe.aspect ?? defaults.aspect,
      imageUrl: i2iShowcaseOutputPath(modelId),
      historyTitle: recipe.historyTitle,
      actionTab: "Image to Image",
      referenceImageUrl: I2I_SHOWCASE_SHARED_REFERENCE,
      ...(imageI2iUsesStyleSlot(modelId)
        ? { styleImageUrl: I2I_SHOWCASE_SHARED_STYLE }
        : {})
    };
  }
  return out;
}

const IMAGE_T2I_SHOWCASES = buildT2iShowcases();
const IMAGE_I2I_SHOWCASES = buildI2iShowcases();

export function getImageModelShowcase(
  modelId: string,
  actionTab: ImageActionTab = "Text to Image"
): ImageModelShowcase | null {
  if (actionTab === "Image to Image") {
    return IMAGE_I2I_SHOWCASES[modelId] ?? null;
  }
  return IMAGE_T2I_SHOWCASES[modelId] ?? null;
}

export function listImageModelShowcaseIds(actionTab: ImageActionTab = "Text to Image"): string[] {
  const map = actionTab === "Image to Image" ? IMAGE_I2I_SHOWCASES : IMAGE_T2I_SHOWCASES;
  return Object.keys(map);
}

/** Absolute https URL for a public showcase asset (Atlas needs reachable https). */
export function showcaseAssetUrl(publicPath: string, origin?: string): string {
  if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
    return publicPath.replace(/^http:\/\//i, "https://");
  }
  const base = origin?.replace(/\/$/, "") ?? "";
  return base ? `${base}${publicPath}` : publicPath;
}
