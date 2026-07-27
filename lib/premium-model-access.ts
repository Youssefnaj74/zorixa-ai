import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  isPremiumImageModel,
  isPremiumVideoModel
} from "@/lib/premium-model-ids";

export {
  isPremiumImageModel,
  isPremiumVideoModel,
  PREMIUM_IMAGE_COMPOSER_IDS,
  PREMIUM_VIDEO_COMPOSER_IDS
} from "@/lib/premium-model-ids";

export async function userIsPremium(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("users_profiles")
    .select("is_premium")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[premium-model-access] profile read failed", error.message);
    return false;
  }
  return Boolean(data?.is_premium);
}

export async function assertPremiumModelAccess(args: {
  userId: string;
  composerModelId: string;
  kind: "video" | "image";
}): Promise<Response | null> {
  const locked =
    args.kind === "video"
      ? isPremiumVideoModel(args.composerModelId)
      : isPremiumImageModel(args.composerModelId);
  if (!locked) return null;

  const premium = await userIsPremium(args.userId);
  if (premium) return null;

  return Response.json(
    {
      error: "PREMIUM_MODEL_REQUIRED",
      message:
        args.kind === "video"
          ? "This model is available on paid plans. Subscribe to unlock Kling, Veo, Hailuo, Seedance 2, and other premium video models."
          : "This image model is available on paid plans. Subscribe to unlock premium image models.",
      upgrade_url: "/pricing"
    },
    { status: 403 }
  );
}
