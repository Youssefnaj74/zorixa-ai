import type { TtsVoice } from "@/lib/tts/types";

/** MiniMax synchronous TTS character limit per request. */
export const TTS_MAX_CHARS = 10_000;

/** MiniMax `voice_setting.speed` range (see synthesize provider). */
export const TTS_SPEED_MIN = 0.5;
export const TTS_SPEED_MAX = 2;
export const TTS_SPEED_DEFAULT = 1;
export const TTS_SPEED_STEP = 0.05;

export function clampTtsSpeed(speed: number): number {
  const stepped = Math.round(speed / TTS_SPEED_STEP) * TTS_SPEED_STEP;
  return Math.min(TTS_SPEED_MAX, Math.max(TTS_SPEED_MIN, stepped));
}

export function formatTtsSpeedLabel(speed: number): string {
  const value = clampTtsSpeed(speed);
  return `${value.toFixed(2).replace(/\.?0+$/, "")}x`;
}

/** Accepted formats for MiniMax voice clone source audio. */
export const TTS_CLONE_ACCEPTED_EXTENSIONS = ["mp3", "m4a", "wav"] as const;
export const TTS_CLONE_MAX_BYTES = 20 * 1024 * 1024;
export const TTS_CLONE_MIN_DURATION_SEC = 10;
export const TTS_CLONE_MAX_DURATION_SEC = 5 * 60;

/** MiniMax activation preview spoken after clone — must match server billing. */
export const TTS_CLONE_ACTIVATION_TEXT =
  "Hello. This is your cloned voice on Zorixa AI. It is ready to use for speech generation.";

export function isTtsCloneAudioExtension(ext: string): boolean {
  return (TTS_CLONE_ACCEPTED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

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
