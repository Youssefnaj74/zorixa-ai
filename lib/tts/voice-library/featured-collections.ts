import type { TtsVoice } from "@/lib/tts/types";

import { haystackIncludes, voiceDiscoveryHaystack } from "@/lib/tts/voice-library/voice-discovery";

export type FeaturedCollectionId =
  | "featured"
  | "most-used"
  | "podcast"
  | "audiobook"
  | "advertising"
  | "storytelling"
  | "business"
  | "gaming"
  | "calm"
  | "emotional"
  | "energetic"
  | "kids"
  | "multilingual"
  | "singing"
  | "funny";

export type FeaturedCollection = {
  id: FeaturedCollectionId;
  label: string;
  emoji: string;
  matches: (voice: TtsVoice) => boolean;
};

function styleIs(voice: TtsVoice, ...styles: string[]): boolean {
  const style = voice.labels?.style?.toLowerCase() ?? "";
  return styles.some((s) => style === s.toLowerCase());
}

function genderIs(voice: TtsVoice, gender: string): boolean {
  return voice.labels?.gender === gender;
}

export const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    id: "featured",
    label: "Featured",
    emoji: "⭐",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        styleIs(voice, "Narrator", "Conversational", "Audiobook", "Calm") ||
        haystackIncludes(hay, "narrator", "storyteller", "podcast", "expressive", "captivating")
      );
    }
  },
  {
    id: "most-used",
    label: "Most Used",
    emoji: "🔥",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        voice.labels?.language === "english" &&
        (styleIs(voice, "Narrator", "Conversational", "Audiobook", "Calm", "News") ||
          haystackIncludes(hay, "narrator", "calm", "podcast", "storyteller", "trustworthy"))
      );
    }
  },
  {
    id: "podcast",
    label: "Podcast",
    emoji: "🎙",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        haystackIncludes(hay, "podcast", "host", "radio") ||
        styleIs(voice, "Conversational", "Narrator")
      );
    }
  },
  {
    id: "audiobook",
    label: "Audiobook",
    emoji: "📚",
    matches: (voice) =>
      styleIs(voice, "Audiobook", "Narrator") ||
      haystackIncludes(voiceDiscoveryHaystack(voice), "audiobook", "storyteller", "storytelling", "book")
  },
  {
    id: "advertising",
    label: "Advertising",
    emoji: "📢",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return haystackIncludes(
        hay,
        "advert",
        "commercial",
        "promo",
        "announcer",
        "marketing",
        "compelling"
      );
    }
  },
  {
    id: "storytelling",
    label: "Storytelling",
    emoji: "🎬",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        styleIs(voice, "Audiobook", "Narrator") ||
        haystackIncludes(hay, "story", "storyteller", "storytelling", "narrator", "documentary")
      );
    }
  },
  {
    id: "business",
    label: "Business",
    emoji: "💼",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return haystackIncludes(
        hay,
        "business",
        "executive",
        "professional",
        "corporate",
        "reliable",
        "trustworthy",
        "authoritative"
      );
    }
  },
  {
    id: "gaming",
    label: "Gaming",
    emoji: "🎮",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return haystackIncludes(hay, "gaming", "game", "gamer", "energetic", "dynamic", "upbeat");
    }
  },
  {
    id: "calm",
    label: "Calm",
    emoji: "😌",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        styleIs(voice, "Calm") ||
        haystackIncludes(hay, "calm", "soothing", "gentle", "serene", "soft", "peaceful", "relax")
      );
    }
  },
  {
    id: "emotional",
    label: "Emotional",
    emoji: "❤️",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        styleIs(voice, "Emotional") ||
        haystackIncludes(hay, "emotional", "expressive", "passionate", "dramatic", "soulful")
      );
    }
  },
  {
    id: "energetic",
    label: "Energetic",
    emoji: "⚡",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        styleIs(voice, "Energetic") ||
        haystackIncludes(hay, "energetic", "vibrant", "lively", "dynamic", "upbeat", "radiant")
      );
    }
  },
  {
    id: "kids",
    label: "Kids",
    emoji: "👶",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return (
        styleIs(voice, "Child") ||
        genderIs(voice, "child") ||
        haystackIncludes(hay, "child", "kid", "young", "toddler", "teen")
      );
    }
  },
  {
    id: "multilingual",
    label: "Multilingual",
    emoji: "🌍",
    matches: (voice) =>
      voice.labels?.language === "multilingual" ||
      (voice.labels?.language != null && voice.labels.language !== "english")
  },
  {
    id: "singing",
    label: "Singing",
    emoji: "🎵",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return haystackIncludes(hay, "sing", "singing", "vocal", "music", "melody", "song");
    }
  },
  {
    id: "funny",
    label: "Funny",
    emoji: "😂",
    matches: (voice) => {
      const hay = voiceDiscoveryHaystack(voice);
      return haystackIncludes(hay, "funny", "comedian", "comedy", "humor", "humour", "witty");
    }
  }
];

export function filterVoicesByFeaturedCollection(
  voices: TtsVoice[],
  collectionId: FeaturedCollectionId | "all"
): TtsVoice[] {
  if (collectionId === "all") return voices;
  const collection = FEATURED_COLLECTIONS.find((c) => c.id === collectionId);
  if (!collection) return voices;
  return voices.filter((voice) => collection.matches(voice));
}

export function countFeaturedCollections(voices: TtsVoice[]): Record<FeaturedCollectionId, number> {
  const counts = Object.fromEntries(
    FEATURED_COLLECTIONS.map((c) => [c.id, 0])
  ) as Record<FeaturedCollectionId, number>;

  for (const voice of voices) {
    for (const collection of FEATURED_COLLECTIONS) {
      if (collection.matches(voice)) counts[collection.id] += 1;
    }
  }

  return counts;
}
