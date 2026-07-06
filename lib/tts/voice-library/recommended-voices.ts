import type { TtsVoice } from "@/lib/tts/types";

import { voiceDiscoveryHaystack } from "@/lib/tts/voice-library/voice-discovery";

type RecommendedSlot = {
  /** Display hint — matched against real voice names, not injected. */
  hint: string;
  patterns: RegExp[];
  gender?: "male" | "female" | "neutral" | "child";
  style?: string[];
};

const RECOMMENDED_SLOTS: RecommendedSlot[] = [
  {
    hint: "Assertive Queen",
    patterns: [/assertive.*queen/i, /\bqueen\b/i, /authoritative.*female/i],
    gender: "female"
  },
  {
    hint: "Calm Woman",
    patterns: [/calm.*woman/i, /calmwoman/i, /\bcalm\b.*\bwoman\b/i],
    gender: "female"
  },
  {
    hint: "Expressive Narrator",
    patterns: [/expressive.*narrator/i, /narrator.*expressive/i, /expressive_narrator/i]
  },
  {
    hint: "Podcast Host",
    patterns: [/podcast/i, /podcast.*host/i, /\bhost\b/i]
  },
  {
    hint: "Warm Storyteller",
    patterns: [/storyteller/i, /warm.*stor/i, /captivating.*stor/i]
  },
  {
    hint: "Business Female",
    patterns: [/business/i, /executive/i, /professional/i, /reliable/i, /compelling.*lady/i],
    gender: "female"
  },
  {
    hint: "Deep Male",
    patterns: [/deep/i, /magnetic.*man/i, /magnetic.*male/i, /trustworth/i, /baritone/i],
    gender: "male"
  },
  {
    hint: "Friendly Guy",
    patterns: [/friendly/i, /companion/i, /conversational/i, /\bguy\b/i],
    gender: "male"
  }
];

function scoreSlotMatch(voice: TtsVoice, slot: RecommendedSlot): number {
  const hay = voiceDiscoveryHaystack(voice);
  const nameId = `${voice.name} ${voice.voice_id}`.toLowerCase();
  let score = 0;

  for (const pattern of slot.patterns) {
    if (pattern.test(voice.name) || pattern.test(voice.voice_id)) score += 12;
    else if (pattern.test(hay)) score += 6;
    else if (pattern.test(nameId)) score += 4;
  }

  if (slot.gender && voice.labels?.gender === slot.gender) score += 4;
  if (slot.style?.includes(voice.labels?.style ?? "")) score += 3;
  if (voice.labels?.language === "english") score += 2;

  return score;
}

/**
 * Picks up to 8 curated voices from the live library (Spotify-style row).
 * Never invents voices — only returns voices present in `pool`.
 */
export function pickRecommendedVoices(pool: TtsVoice[], limit = 8): TtsVoice[] {
  const candidates = pool.filter((v) => v.category === "system" || v.category == null);
  const used = new Set<string>();
  const picked: TtsVoice[] = [];

  for (const slot of RECOMMENDED_SLOTS) {
    let best: { voice: TtsVoice; score: number } | null = null;

    for (const voice of candidates) {
      if (used.has(voice.voice_id)) continue;
      const score = scoreSlotMatch(voice, slot);
      if (score > 0 && (!best || score > best.score)) {
        best = { voice, score };
      }
    }

    if (best) {
      used.add(best.voice.voice_id);
      picked.push(best.voice);
    }
  }

  if (picked.length < limit) {
    const fillers = candidates
      .filter((v) => !used.has(v.voice_id) && v.labels?.language === "english")
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const voice of fillers) {
      used.add(voice.voice_id);
      picked.push(voice);
      if (picked.length >= limit) break;
    }
  }

  return picked.slice(0, limit);
}
