/** Voice style tags surfaced in the library UI. */
export const TTS_VOICE_STYLES = [
  "Narrator",
  "Conversational",
  "News",
  "Audiobook",
  "Emotional",
  "Calm",
  "Energetic",
  "Child",
  "General"
] as const;

export type TtsVoiceStyle = (typeof TTS_VOICE_STYLES)[number];

export type TtsVoiceGender = "male" | "female" | "neutral" | "child";

export type TtsVoiceLanguageMeta = {
  id: string;
  label: string;
  flag: string;
  code: string;
};

/** Maps MiniMax voice_id language prefixes to display metadata. */
export const TTS_LANGUAGE_BY_PREFIX: Record<string, TtsVoiceLanguageMeta> = {
  english: { id: "english", label: "English", flag: "🇺🇸", code: "en" },
  chinese: { id: "chinese", label: "Chinese", flag: "🇨🇳", code: "zh" },
  mandarin: { id: "chinese", label: "Chinese", flag: "🇨🇳", code: "zh" },
  cantonese: { id: "cantonese", label: "Cantonese", flag: "🇭🇰", code: "yue" },
  japanese: { id: "japanese", label: "Japanese", flag: "🇯🇵", code: "ja" },
  korean: { id: "korean", label: "Korean", flag: "🇰🇷", code: "ko" },
  spanish: { id: "spanish", label: "Spanish", flag: "🇪🇸", code: "es" },
  french: { id: "french", label: "French", flag: "🇫🇷", code: "fr" },
  german: { id: "german", label: "German", flag: "🇩🇪", code: "de" },
  italian: { id: "italian", label: "Italian", flag: "🇮🇹", code: "it" },
  portuguese: { id: "portuguese", label: "Portuguese", flag: "🇧🇷", code: "pt" },
  russian: { id: "russian", label: "Russian", flag: "🇷🇺", code: "ru" },
  arabic: { id: "arabic", label: "Arabic", flag: "🇸🇦", code: "ar" },
  hindi: { id: "hindi", label: "Hindi", flag: "🇮🇳", code: "hi" },
  indonesian: { id: "indonesian", label: "Indonesian", flag: "🇮🇩", code: "id" },
  vietnamese: { id: "vietnamese", label: "Vietnamese", flag: "🇻🇳", code: "vi" },
  thai: { id: "thai", label: "Thai", flag: "🇹🇭", code: "th" },
  turkish: { id: "turkish", label: "Turkish", flag: "🇹🇷", code: "tr" },
  polish: { id: "polish", label: "Polish", flag: "🇵🇱", code: "pl" },
  dutch: { id: "dutch", label: "Dutch", flag: "🇳🇱", code: "nl" }
};

export const TTS_VOICE_FAVORITES_STORAGE_KEY = "zorixa-tts-voice-favorites";

/** Short preview lines keyed by language id (used by voice-preview API). */
export const TTS_PREVIEW_TEXT_BY_LANGUAGE: Record<string, string> = {
  english: "Hello, this is a preview of my voice.",
  chinese: "你好，这是我声音的预览。",
  cantonese: "你好，呢個係我聲音嘅預覽。",
  japanese: "こんにちは、これは私の声のプレビューです。",
  korean: "안녕하세요, 제 목소리 미리듣기입니다.",
  spanish: "Hola, esta es una vista previa de mi voz.",
  french: "Bonjour, voici un aperçu de ma voix.",
  german: "Hallo, das ist eine Vorschau meiner Stimme.",
  italian: "Ciao, questa è un'anteprima della mia voce.",
  portuguese: "Olá, esta é uma prévia da minha voz.",
  russian: "Привет, это предпросмотр моего голоса.",
  arabic: "مرحبًا، هذه معاينة لصوتي.",
  hindi: "नमस्ते, यह मेरी आवाज़ का पूर्वावलोकन है।",
  indonesian: "Halo, ini pratinjau suara saya.",
  vietnamese: "Xin chào, đây là bản xem trước giọng nói của tôi.",
  thai: "สวัสดี นี่คือตัวอย่างเสียงของฉัน",
  turkish: "Merhaba, bu sesimin önizlemesidir.",
  polish: "Cześć, to podgląd mojego głosu.",
  dutch: "Hallo, dit is een preview van mijn stem."
};

export const TTS_DEFAULT_PREVIEW_TEXT = "Hello, this is a voice preview.";
