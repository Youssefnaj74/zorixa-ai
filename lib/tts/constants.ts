import type { TtsVoice } from "@/lib/tts/types";

/** MiniMax synchronous TTS character limit per request. */
export const TTS_MAX_CHARS = 10_000;

/** Curated English system voices — used when the voices API is unavailable. */
export const TTS_DEFAULT_VOICES: TtsVoice[] = [
  {
    voice_id: "English_expressive_narrator",
    name: "Expressive Narrator",
    labels: { accent: "english", gender: "neutral" },
    category: "system"
  },
  {
    voice_id: "English_radiant_girl",
    name: "Radiant Girl",
    labels: { accent: "english", gender: "female" },
    category: "system"
  },
  {
    voice_id: "English_magnetic_voiced_man",
    name: "Magnetic-voiced Male",
    labels: { accent: "english", gender: "male" },
    category: "system"
  },
  {
    voice_id: "English_CalmWoman",
    name: "Calm Woman",
    labels: { accent: "english", gender: "female" },
    category: "system"
  },
  {
    voice_id: "English_Trustworth_Man",
    name: "Trustworthy Man",
    labels: { accent: "english", gender: "male" },
    category: "system"
  },
  {
    voice_id: "English_CaptivatingStoryteller",
    name: "Captivating Storyteller",
    labels: { accent: "english", gender: "neutral" },
    category: "system"
  }
];
