import { env } from "@/lib/env";

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: any;
  error?: any;
};

export async function createPrediction(model: string, input: Record<string, any>) {
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      authorization: `Token ${env.required("REPLICATE_API_TOKEN")}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ model, input })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate create failed: ${text}`);
  }

  return (await res.json()) as ReplicatePrediction;
}

export async function getPrediction(id: string) {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: {
      authorization: `Token ${env.required("REPLICATE_API_TOKEN")}`
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate get failed: ${text}`);
  }

  return (await res.json()) as ReplicatePrediction;
}

export function extractFirstUrl(output: any): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output.find((x) => typeof x === "string");
    return first ?? null;
  }
  if (typeof output === "object" && typeof output.url === "string") return output.url;
  return null;
}

