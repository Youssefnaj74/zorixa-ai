/** User-facing hint when Atlas returns a generic failed status. */
export function formatAtlasVideoFailureForUi(
  error: string | null | undefined,
  opts?: { generateAudio?: boolean; hostIsProduction?: boolean }
): string {
  const raw = (error ?? "Atlas prediction failed").trim();
  const parts = [raw];

  if (raw.toLowerCase() === "task failed") {
    parts.push(
      "Atlas Cloud rejected this job (no detailed reason). Check Request History on atlascloud.ai for this prediction."
    );
    if (opts?.hostIsProduction) {
      parts.push(
        "zorixaai.com uses ATLASCLOUD_API_KEY from Vercel — it may differ from your local .env.local key or balance."
      );
    }
  }

  if (opts?.generateAudio) {
    parts.push("Try Audio Off, then Generate again.");
  }

  return parts.join(" ");
}
