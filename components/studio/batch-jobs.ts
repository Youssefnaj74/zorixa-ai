export async function fetchCreditsBalance(): Promise<number | null> {
  const res = await fetch("/api/credits", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { credits_balance?: number };
  return data.credits_balance ?? 0;
}

export async function uploadFileToApi(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

export async function pollGenerationJob(
  id: string,
  options: { maxIters?: number; delayMs?: number } = {}
): Promise<string | null> {
  const maxIters = options.maxIters ?? 120;
  const delayMs = options.delayMs ?? 1500;
  for (let i = 0; i < maxIters; i += 1) {
    await new Promise((r) => setTimeout(r, delayMs));
    const res = await fetch(`/api/generations/${id}`, { cache: "no-store" });
    const data = (await res.json()) as {
      status?: "pending" | "completed" | "failed";
      output_url?: string | null;
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Polling failed");
    if (data.status === "completed") return data.output_url ?? null;
    if (data.status === "failed") throw new Error("Generation failed");
  }
  throw new Error("Timed out");
}

export async function pollVideoJob(id: string): Promise<string | null> {
  return pollGenerationJob(id, { maxIters: 160, delayMs: 2000 });
}
