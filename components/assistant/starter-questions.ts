export type AssistantPageKey =
  | "video"
  | "image"
  | "billing"
  | "settings"
  | "audio"
  | "general";

export function resolveAssistantPageKey(pathname: string | null | undefined): AssistantPageKey {
  const path = (pathname ?? "").toLowerCase();
  if (path.startsWith("/video")) return "video";
  if (path.startsWith("/image")) return "image";
  if (
    path.startsWith("/pricing") ||
    path.startsWith("/billing") ||
    path.startsWith("/dashboard/billing")
  ) {
    return "billing";
  }
  if (path.startsWith("/dashboard/api") || path.includes("/settings")) return "settings";
  if (path.startsWith("/audio")) return "audio";
  return "general";
}

/** Header title — page-aware, e.g. "Video Studio Assistant". */
export function assistantTitle(key: AssistantPageKey): string {
  switch (key) {
    case "video":
      return "Video Studio Assistant";
    case "image":
      return "Image Studio Assistant";
    case "billing":
      return "Billing Assistant";
    case "settings":
      return "API Assistant";
    case "audio":
      return "Audio Studio Assistant";
    default:
      return "ZorixaAI Assistant";
  }
}

export function assistantPageLabel(key: AssistantPageKey): string {
  switch (key) {
    case "video":
      return "Video Studio";
    case "image":
      return "Image Studio";
    case "billing":
      return "Billing";
    case "settings":
      return "API Access";
    case "audio":
      return "Audio Studio";
    default:
      return "ZorixaAI";
  }
}

export function assistantEmptyHeadline(key: AssistantPageKey): string {
  switch (key) {
    case "video":
      return "Ready to create your next clip?";
    case "image":
      return "Let’s craft a stronger image.";
    case "billing":
      return "Need help with credits or plans?";
    case "settings":
      return "Set up API access faster.";
    case "audio":
      return "Voice & speech help.";
    default:
      return "Your creative co-pilot.";
  }
}

export type StarterQuestion = { id: string; label: string; message: string };

export function getAssistantStarterQuestions(page: AssistantPageKey): StarterQuestion[] {
  switch (page) {
    case "video":
      return [
        {
          id: "v1",
          label: "Best model for UGC",
          message: "Which model is best for UGC ads?"
        },
        {
          id: "v2",
          label: "Improve my prompt",
          message: "Improve my current video prompt."
        },
        {
          id: "v3",
          label: "Why did my generation fail?",
          message: "Why did my video generation fail and what should I try next?"
        },
        {
          id: "v4",
          label: "Cinematic perfume ad",
          message: "Create a cinematic perfume commercial for Video Studio."
        }
      ];
    case "image":
      return [
        {
          id: "i1",
          label: "Recommend a model",
          message: "Recommend the best image model for my next generation."
        },
        {
          id: "i2",
          label: "Improve my image prompt",
          message: "Improve my current image prompt."
        },
        {
          id: "i3",
          label: "Product photo prompt",
          message: "Write a clean product photo prompt for Image Studio."
        }
      ];
    case "billing":
      return [
        {
          id: "b1",
          label: "Explain my credits",
          message: "Explain how my credits work and what I can generate with my balance."
        },
        {
          id: "b2",
          label: "Which plan should I choose?",
          message: "Which plan should I choose for my usage?"
        }
      ];
    case "settings":
      return [
        {
          id: "s1",
          label: "How do API keys work?",
          message: "How do API keys work on ZorixaAI, and can I use them in Cursor?"
        },
        {
          id: "s2",
          label: "MCP setup",
          message: "How do I connect Zorixa MCP in Cursor?"
        }
      ];
    case "audio":
      return [
        {
          id: "a1",
          label: "Voice clone limits",
          message: "What are the voice cloning limits on ZorixaAI?"
        },
        {
          id: "a2",
          label: "TTS tips",
          message: "How do I get the best results from Text-to-Speech?"
        }
      ];
    default:
      return [
        {
          id: "g1",
          label: "Recommend a video model",
          message: "Recommend a video model for cinematic advertising."
        },
        {
          id: "g2",
          label: "Improve my image prompt",
          message: "Help me improve an image prompt for a product photo."
        },
        {
          id: "g3",
          label: "Generate a cinematic prompt",
          message: "Generate a cinematic perfume commercial prompt for Video Studio."
        },
        {
          id: "g4",
          label: "Explain my credits",
          message: "Explain how my credits work on ZorixaAI."
        }
      ];
  }
}
