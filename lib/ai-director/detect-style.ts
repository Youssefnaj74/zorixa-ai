import { getDirectorRoutingConfig } from "@/lib/ai-director/config";
import type { DirectorResolvedStyle, DirectorStyleInput } from "@/lib/ai-director/types";

/** Keyword scoring — no LLM cost. Swap rules in `data/ai-director-routing.json`. */
export function detectDirectorStyleFromPrompt(prompt: string): DirectorResolvedStyle {
  const { autoDetection, autoDefaultStyle } = getDirectorRoutingConfig();
  const text = prompt.trim().toLowerCase();
  if (!text) return autoDefaultStyle;

  let bestStyle: DirectorResolvedStyle = autoDefaultStyle;
  let bestScore = 0;

  for (const style of Object.keys(autoDetection) as DirectorResolvedStyle[]) {
    const keywords = autoDetection[style] ?? [];
    let score = 0;
    for (const keyword of keywords) {
      const k = keyword.toLowerCase();
      if (text.includes(k)) score += k.includes(" ") ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestStyle = style;
    }
  }

  return bestStyle;
}

export function resolveDirectorStyleInput(
  style: DirectorStyleInput,
  prompt: string
): DirectorResolvedStyle {
  if (style === "auto") return detectDirectorStyleFromPrompt(prompt);
  return style;
}
