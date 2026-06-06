import { getDirectorRoutingConfig } from "@/lib/ai-director/config";
import type { DirectorModelInfo } from "@/lib/ai-director/types";

const FALLBACK_INFO: DirectorModelInfo = {
  summary: "Selected for this prompt and style based on motion quality and reliability.",
  whyBullets: ["Balanced quality", "Good motion", "Reliable output", "Style match"]
};

export function getDirectorModelInfo(modelId: string): DirectorModelInfo {
  return getDirectorRoutingConfig().models[modelId] ?? FALLBACK_INFO;
}

export function getDirectorExamples() {
  return getDirectorRoutingConfig().directorExamples;
}

/** Next model in the style chain (primary → fallbacks). */
export function getNextDirectorModelInChain(currentModelId: string, chain: string[]): string | null {
  const unique = [...new Set(chain.filter(Boolean))];
  if (unique.length <= 1) return null;
  const idx = unique.indexOf(currentModelId);
  const nextIdx = idx < 0 ? 1 : (idx + 1) % unique.length;
  const next = unique[nextIdx];
  if (next === currentModelId) {
    const alt = unique[(nextIdx + 1) % unique.length];
    return alt === currentModelId ? null : alt;
  }
  return next;
}
