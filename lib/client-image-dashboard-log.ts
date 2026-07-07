/** Fire-and-forget: persist completed image outputs to /dashboard/history (idempotent). */
export async function persistImageOutputsToDashboard(args: {
  outputUrls: string[];
  predictionIds?: string[];
  modelId: string;
  prompt?: string | null;
  inputUrl?: string | null;
}): Promise<void> {
  const { outputUrls, predictionIds = [], modelId, prompt, inputUrl } = args;
  const promptText = typeof prompt === "string" ? prompt.trim() : "";
  const input = typeof inputUrl === "string" ? inputUrl.trim() : "";

  await Promise.allSettled(
    outputUrls.map((output_url, index) => {
      const prediction_id =
        predictionIds.length === outputUrls.length
          ? predictionIds[index] ?? null
          : predictionIds[0] ?? null;

      return fetch("/api/generations/atlas-image-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          output_url,
          input_url: input || undefined,
          prediction_id,
          image_model: modelId,
          prompt: promptText || undefined
        })
      });
    })
  );
}
