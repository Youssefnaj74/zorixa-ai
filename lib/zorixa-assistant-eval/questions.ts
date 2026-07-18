import type { ZorixaAssistantClientContext } from "@/lib/zorixa-assistant-types";

export type EvalCategory =
  | "model_recommendations"
  | "prompt_generation"
  | "prompt_improvement"
  | "credits"
  | "pricing"
  | "billing"
  | "video_studio"
  | "image_studio"
  | "voice_cloning"
  | "ai_director"
  | "api_keys"
  | "generation_failures"
  | "account"
  | "off_topic"
  | "missing_information";

export type EvalExpect = "off_topic" | "missing_info" | "grounded" | "grounded_or_missing";

export type EvalQuestion = {
  id: string;
  category: EvalCategory;
  question: string;
  expect: EvalExpect;
  client?: ZorixaAssistantClientContext;
  userCredits?: number;
  userPlan?: string;
  isPremium?: boolean;
  mustIncludeAny?: string[];
  mustIncludeAll?: string[];
  mustNotInclude?: string[];
  expectPromptLike?: boolean;
};

const HALLUCINATION_BAN = [
  "midjourney is available",
  "we offer midjourney",
  "sora is available",
  "we offer sora",
  "$49.00",
  "$99/mo",
  "$99 per month"
];

function item(
  id: string,
  category: EvalCategory,
  question: string,
  expect: EvalExpect,
  extra: Partial<EvalQuestion> = {}
): EvalQuestion {
  return {
    id,
    category,
    question,
    expect,
    ...extra,
    mustNotInclude: [...HALLUCINATION_BAN, ...(extra.mustNotInclude ?? [])]
  };
}

export const ASSISTANT_EVAL_QUESTIONS: EvalQuestion[] = [
  // —— Model recommendations (12) ——
  item("m01", "model_recommendations", "Which model is best for anime?", "grounded", {
    mustIncludeAny: ["seedance 1.5", "seedance-1-5"]
  }),
  item("m02", "model_recommendations", "Which model should I use for UGC ads?", "grounded", {
    mustIncludeAny: ["grok", "hailuo", "ugc"]
  }),
  item("m03", "model_recommendations", "What model is best for cinematic commercials?", "grounded", {
    mustIncludeAny: ["seedance", "kling"],
    mustIncludeAll: ["cinematic"]
  }),
  item("m04", "model_recommendations", "Recommend a model for product showcase videos.", "grounded", {
    mustIncludeAny: ["vidu", "product", "kling"]
  }),
  item("m05", "model_recommendations", "Is Google Veo 3.1 available on ZorixaAI?", "grounded", {
    mustIncludeAny: ["veo"]
  }),
  item("m06", "model_recommendations", "Do you have Hailuo 2.3?", "grounded", {
    mustIncludeAny: ["hailuo"]
  }),
  item("m07", "model_recommendations", "Which image model should I try first?", "grounded", {
    mustIncludeAny: ["flux", "gpt image", "seedream", "nano banana", "wan"]
  }),
  item(
    "m08",
    "model_recommendations",
    "For Best Quality in AI Director, which video model is typically used?",
    "grounded",
    { mustIncludeAny: ["kling"] }
  ),
  item("m09", "model_recommendations", "Can I use Midjourney inside ZorixaAI?", "grounded", {
    mustNotInclude: ["yes you can use midjourney", "midjourney on zorixa"]
  }),
  item("m10", "model_recommendations", "Is OpenAI Sora available in Video Studio?", "grounded", {
    mustNotInclude: ["yes, sora", "sora is on zorixa"]
  }),
  item(
    "m11",
    "model_recommendations",
    "What's a good Wan video model on Zorixa?",
    "grounded",
    { mustIncludeAny: ["wan"] }
  ),
  item(
    "m12",
    "model_recommendations",
    "List a few video models available on ZorixaAI.",
    "grounded",
    { mustIncludeAny: ["seedance", "hailuo", "kling", "veo", "wan"] }
  ),

  // —— Prompt generation (8) ——
  item("pg01", "prompt_generation", "Write me a luxury perfume prompt.", "grounded", {
    client: {
      page: "Video Studio",
      selectedModel: "seedance-2",
      selectedDuration: "5s",
      selectedQuality: "Best"
    },
    expectPromptLike: true,
    mustIncludeAny: ["perfume", "luxury", "fragrance", "bottle"]
  }),
  item("pg02", "prompt_generation", "Generate a UGC hook prompt for a skincare serum.", "grounded", {
    client: { page: "Video Studio", selectedModel: "hailuo-2-3" },
    expectPromptLike: true,
    mustIncludeAny: ["serum", "skin", "product", "hook"]
  }),
  item("pg03", "prompt_generation", "Write a cinematic night city drone shot prompt.", "grounded", {
    client: { page: "Video Studio", selectedModel: "seedance-2" },
    expectPromptLike: true,
    mustIncludeAny: ["city", "night", "drone", "cinematic"]
  }),
  item("pg04", "prompt_generation", "Create an anime battle scene prompt.", "grounded", {
    client: { page: "Video Studio", selectedModel: "seedance-1-5" },
    expectPromptLike: true,
    mustIncludeAny: ["anime", "battle", "warrior", "fight"]
  }),
  item("pg05", "prompt_generation", "Write a text-to-image prompt for a minimal product photo.", "grounded", {
    client: { page: "Image Studio", selectedModel: "flux-dev" },
    expectPromptLike: true,
    mustIncludeAny: ["product", "minimal", "photo", "studio"]
  }),
  item("pg06", "prompt_generation", "Give me a vertical 9:16 food ad prompt.", "grounded", {
    client: {
      page: "Video Studio",
      selectedModel: "vidu-q3-pro",
      selectedAspectRatio: "9:16"
    },
    expectPromptLike: true,
    mustIncludeAny: ["food", "ad", "dish", "meal"]
  }),
  item("pg07", "prompt_generation", "Write a prompt for a talking-head UGC testimonial.", "grounded", {
    expectPromptLike: true,
    mustIncludeAny: ["testimonial", "speaking", "camera", "person", "ugc"]
  }),
  item("pg08", "prompt_generation", "Prompt for a sneaker unboxing video.", "grounded", {
    expectPromptLike: true,
    mustIncludeAny: ["sneaker", "shoe", "unbox", "box"]
  }),

  // —— Prompt improvement (6) ——
  item("pi01", "prompt_improvement", "Improve my prompt.", "grounded", {
    client: {
      page: "Video Studio",
      selectedModel: "hailuo-2-3",
      selectedDuration: "5s",
      selectedQuality: "Best",
      draftPrompt: "girl walking"
    },
    expectPromptLike: true,
    mustIncludeAll: ["/10"],
    mustIncludeAny: ["walk", "girl", "hailuo"]
  }),
  item(
    "pi07",
    "prompt_improvement",
    "Optimize this prompt for Grok Imagine.",
    "grounded",
    {
      client: {
        page: "Video Studio",
        selectedModel: "grok-imagine-video-t2v",
        draftPrompt:
          "Ultra cinematic orbit then push in then pull back then rack focus on a woman in rain"
      },
      expectPromptLike: true,
      mustIncludeAll: ["/10", "grok"],
      mustNotInclude: ["kling is better", "use kling instead", "switch to kling"]
    }
  ),
  item("pi02", "prompt_improvement", "Make this prompt more cinematic.", "grounded", {
    client: { selectedModel: "seedance-2", draftPrompt: "car on a road" },
    expectPromptLike: true,
    mustIncludeAny: ["car", "road", "cinematic", "camera"]
  }),
  item("pi03", "prompt_improvement", "Improve this for anime style.", "grounded", {
    client: { selectedModel: "seedance-1-5", draftPrompt: "warrior fights a dragon" },
    expectPromptLike: true,
    mustIncludeAny: ["warrior", "dragon", "anime"]
  }),
  item("pi04", "prompt_improvement", "Rewrite my prompt for a product shot.", "grounded", {
    client: {
      page: "Image Studio",
      selectedModel: "seedream-5",
      draftPrompt: "bottle on table"
    },
    expectPromptLike: true,
    mustIncludeAny: ["bottle", "product", "table"]
  }),
  item("pi05", "prompt_improvement", "Make my prompt shorter but stronger.", "grounded", {
    client: {
      draftPrompt:
        "A very beautiful amazing incredible woman in a dress walking slowly in a city at night with neon lights and reflections"
    },
    expectPromptLike: true
  }),
  item("pi06", "prompt_improvement", "Add camera movement suggestions to my prompt.", "grounded", {
    client: { selectedModel: "kling-3-pro", draftPrompt: "ocean waves at sunset" },
    expectPromptLike: true,
    mustIncludeAny: ["ocean", "wave", "camera", "pan", "dolly", "orbit", "track"]
  }),

  // —— Credits (7) ——
  item("c01", "credits", "How many credits do I have?", "grounded", {
    userCredits: 80,
    mustIncludeAll: ["80"]
  }),
  item("c02", "credits", "I have 80 credits left. What can I do?", "grounded", {
    userCredits: 80,
    mustIncludeAny: ["80", "credit"]
  }),
  item("c03", "credits", "Do unused credits expire immediately?", "grounded", {
    mustIncludeAny: ["stay", "unused", "account", "credit"]
  }),
  item("c04", "credits", "How do credits work on ZorixaAI?", "grounded", {
    mustIncludeAny: ["credit", "generation", "model"]
  }),
  item("c05", "credits", "My session shows 395 credits — confirm my balance.", "grounded", {
    userCredits: 395,
    mustIncludeAll: ["395"]
  }),
  item("c06", "credits", "Where can I see my credit balance?", "grounded", {
    mustIncludeAny: ["navbar", "balance", "credit"]
  }),
  item("c07", "credits", "Do image and video share the same credit wallet?", "grounded", {
    mustIncludeAny: ["credit", "same", "one", "balance"]
  }),

  // —— Pricing (8) ——
  item("p01", "pricing", "How much is the Starter plan?", "grounded", {
    mustIncludeAny: ["9.99", "$9.99"]
  }),
  item("p02", "pricing", "How many credits does Pro include?", "grounded", {
    mustIncludeAny: ["3200", "3,200"]
  }),
  item("p03", "pricing", "Which plan should I buy as a beginner?", "grounded", {
    mustIncludeAny: ["starter"]
  }),
  item("p04", "pricing", "What's the Ultra pack monthly price?", "grounded", {
    mustIncludeAny: ["69.99", "$69.99"]
  }),
  item("p05", "pricing", "How many credits do I get with Creator?", "grounded", {
    mustIncludeAny: ["5600", "5,600"]
  }),
  item("p06", "pricing", "Is there a yearly discount?", "grounded", {
    mustIncludeAny: ["yearly", "year", "discount"]
  }),
  item("p07", "pricing", "Where do I buy credits?", "grounded", {
    mustIncludeAny: ["pricing", "/pricing"]
  }),
  item("p08", "pricing", "Does premium video cost more credits?", "grounded", {
    mustIncludeAny: ["credit", "premium", "veo", "kling", "more"]
  }),

  // —— Billing (6) ——
  item("b01", "billing", "Who do I email for billing issues?", "grounded", {
    mustIncludeAny: ["billing@zorixaai.com"]
  }),
  item("b02", "billing", "Are credits refundable?", "grounded", {
    mustIncludeAny: ["non-refundable", "refund", "law"]
  }),
  item("b03", "billing", "What payment processor does Zorixa use?", "grounded", {
    mustIncludeAny: ["dodo"]
  }),
  item("b04", "billing", "Where is the billing page?", "grounded", {
    mustIncludeAny: ["billing", "/billing"]
  }),
  item("b05", "billing", "I was charged twice — what should I do?", "grounded", {
    mustIncludeAny: ["billing@zorixaai.com", "support@zorixaai.com"]
  }),
  item("b06", "billing", "Can I use Zorixa commercially on a paid plan?", "grounded", {
    mustIncludeAny: ["ownership", "commercial", "terms", "retain"]
  }),

  // —— Video Studio (7) ——
  item("v01", "video_studio", "What is the Video Studio URL?", "grounded", {
    mustIncludeAny: ["/video", "video studio"]
  }),
  item("v02", "video_studio", "What tabs are in Video Studio?", "grounded", {
    mustIncludeAny: ["text to video", "image to video", "ai director"]
  }),
  item("v03", "video_studio", "Does Video Studio support reference-to-video?", "grounded", {
    mustIncludeAny: ["reference"]
  }),
  item("v04", "video_studio", "Can I do audio-to-video on Zorixa?", "grounded", {
    mustIncludeAny: ["audio"]
  }),
  item("v05", "video_studio", "How long do video generations usually take?", "grounded", {
    mustIncludeAny: ["1–5", "1-5", "minute"]
  }),
  item("v06", "video_studio", "I'm in Video Studio on Hailuo 5s Best — what am I set up for?", "grounded", {
    client: {
      page: "Video Studio",
      selectedModel: "hailuo-2-3",
      selectedDuration: "5s",
      selectedQuality: "Best"
    },
    mustIncludeAny: ["hailuo", "5"]
  }),
  item("v07", "video_studio", "Is character swap available?", "grounded", {
    mustIncludeAny: ["character swap", "video to video"]
  }),

  // —— Image Studio (6) ——
  item("i01", "image_studio", "What's the Image Studio path?", "grounded", {
    mustIncludeAny: ["/image", "image studio"]
  }),
  item("i02", "image_studio", "What can I do in Image Studio?", "grounded", {
    mustIncludeAny: ["text to image", "image to image", "upscaler"]
  }),
  item("i03", "image_studio", "Do you have an image upscaler?", "grounded", {
    mustIncludeAny: ["upscaler", "upscale"]
  }),
  item("i04", "image_studio", "Is Flux Dev available for images?", "grounded", {
    mustIncludeAny: ["flux"]
  }),
  item("i05", "image_studio", "Can I edit images with a reference upload?", "grounded", {
    mustIncludeAny: ["image to image", "reference", "edit"]
  }),
  item("i06", "image_studio", "Is Seedream available?", "grounded", {
    mustIncludeAny: ["seedream"]
  }),

  // —— Voice cloning / TTS (7) ——
  item("vc01", "voice_cloning", "Where do I clone my voice?", "grounded", {
    mustIncludeAny: ["/audio/clones", "voice clone", "clones"]
  }),
  item("vc02", "voice_cloning", "What's the Text-to-Speech page?", "grounded", {
    mustIncludeAny: ["/audio", "speech", "tts"]
  }),
  item("vc03", "voice_cloning", "What audio formats work for voice cloning?", "grounded", {
    mustIncludeAny: ["mp3", "wav", "m4a"]
  }),
  item("vc04", "voice_cloning", "How long can clone source audio be?", "grounded", {
    mustIncludeAny: ["10", "5 minute", "5 min", "300"]
  }),
  item("vc05", "voice_cloning", "What's the max characters for TTS?", "grounded", {
    mustIncludeAny: ["10000", "10,000", "10 000"]
  }),
  item("vc06", "voice_cloning", "What speed range does TTS support?", "grounded", {
    mustIncludeAny: ["0.5", "2.0", "2x"]
  }),
  item("vc07", "voice_cloning", "Which provider powers Zorixa speech?", "grounded", {
    mustIncludeAny: ["minimax"]
  }),

  // —— AI Director (7) ——
  item("ad01", "ai_director", "What is AI Director?", "grounded", {
    mustIncludeAny: ["router", "video", "model", "style"]
  }),
  item("ad02", "ai_director", "Where do I find AI Director?", "grounded", {
    mustIncludeAny: ["/video", "video studio", "tab"]
  }),
  item("ad03", "ai_director", "What styles does AI Director support?", "grounded", {
    mustIncludeAny: ["cinematic", "ugc", "anime", "product"]
  }),
  item("ad04", "ai_director", "What quality presets does AI Director have?", "grounded", {
    mustIncludeAny: ["fast", "balanced", "best"]
  }),
  item("ad05", "ai_director", "For anime style, which model does AI Director prefer?", "grounded", {
    mustIncludeAny: ["seedance 1.5", "seedance-1-5"]
  }),
  item("ad06", "ai_director", "For UGC style, which model does AI Director prefer?", "grounded", {
    mustIncludeAny: ["grok"]
  }),
  item("ad07", "ai_director", "How long does Best Quality usually take?", "grounded", {
    mustIncludeAny: ["5–10", "5-10", "10"]
  }),

  // —— API keys (7) ——
  item("api01", "api_keys", "Where do I create an API key?", "grounded", {
    mustIncludeAny: ["/dashboard/api", "api access", "dashboard"]
  }),
  item("api02", "api_keys", "What prefix do Zorixa API keys use?", "grounded", {
    mustIncludeAny: ["zrx_live_"]
  }),
  item("api03", "api_keys", "Can I use my API key in Cursor?", "grounded", {
    mustIncludeAny: ["cursor", "mcp", "zrx_live_"]
  }),
  item("api04", "api_keys", "How many API keys can I have?", "grounded", {
    mustIncludeAny: ["5"]
  }),
  item("api05", "api_keys", "What MCP tools does Zorixa expose?", "grounded", {
    mustIncludeAny: ["generate_image", "generate_video", "list_models", "get_credits"]
  }),
  item("api06", "api_keys", "Does MCP spend my website credits?", "grounded", {
    mustIncludeAny: ["credit", "same", "account", "balance"]
  }),
  item("api07", "api_keys", "What Authorization header should I send?", "grounded", {
    mustIncludeAny: ["bearer", "zrx_live_"]
  }),

  // —— Generation failures (7) ——
  item("gf01", "generation_failures", "Why can't I generate videos? It says not enough credits.", "grounded", {
    client: {
      page: "Video Studio",
      selectedModel: "kling-3-pro",
      selectedDuration: "10s",
      selectedQuality: "1080p",
      selectedAspectRatio: "9:16",
      actionTab: "Text to Video",
      speedTier: "Standard",
      soundtrackOn: true,
      uiEstimatedCredits: 433,
      backendCreditsRequired: 433,
      backendCreditsBalance: 377,
      lastGenerateError: "Not enough credits (need 433, you have 377). View plans."
    },
    userCredits: 377,
    mustIncludeAny: ["433", "377", "credit"]
  }),
  item("gf02", "generation_failures", "My prompt was blocked for content policy. What does that mean?", "grounded", {
    mustIncludeAny: ["content policy", "sexual", "explicit", "policy"]
  }),
  item("gf03", "generation_failures", "Generation failed with a provider error — what should I try?", "grounded", {
    mustIncludeAny: ["retry", "history", "support", "prompt", "audio"]
  }),
  item("gf04", "generation_failures", "I see 'Not enough credits (need X, you have Y)'. What now?", "grounded", {
    client: {
      page: "Video Studio",
      selectedModel: "kling-3-pro",
      selectedDuration: "10s",
      selectedQuality: "1080p",
      soundtrackOn: true,
      uiEstimatedCredits: 271,
      backendCreditsRequired: 433,
      backendCreditsBalance: 377,
      lastGenerateError: "Not enough credits (need 433, you have 377). View plans."
    },
    userCredits: 377,
    mustIncludeAny: ["271", "433", "mismatch", "credit"]
  }),
  item("gf05", "generation_failures", "Video soundtrack keeps failing — any tip?", "grounded", {
    mustIncludeAny: ["audio off", "audio", "soundtrack"]
  }),
  item("gf06", "generation_failures", "Where do I check failed generation status?", "grounded", {
    mustIncludeAny: ["history"]
  }),
  item("gf07", "generation_failures", "Will I get a refund if a generation fails?", "grounded_or_missing", {
    mustIncludeAny: ["refund", "support", "non-refundable", "credit"]
  }),

  // —— Account (6) ——
  item("ac01", "account", "How do I contact support?", "grounded", {
    mustIncludeAny: ["support@zorixaai.com"]
  }),
  item("ac02", "account", "What's the general contact email?", "grounded", {
    mustIncludeAny: ["hello@zorixaai.com"]
  }),
  item("ac03", "account", "Who founded Zorixa AI?", "grounded", {
    mustIncludeAny: ["independent", "founder"]
  }),
  item("ac04", "account", "Is Zorixa still in beta?", "grounded", {
    mustIncludeAny: ["public", "beta", "available"]
  }),
  item("ac05", "account", "Is Zorixa safe to use?", "grounded", {
    mustIncludeAny: ["https", "auth", "privacy", "safe"]
  }),
  item("ac06", "account", "Am I on a premium plan?", "grounded", {
    userCredits: 500,
    isPremium: true,
    userPlan: "Premium",
    mustIncludeAny: ["premium", "yes"]
  }),

  // —— Off-topic (10) ——
  item("ot01", "off_topic", "What's the weather in Paris today?", "off_topic"),
  item("ot02", "off_topic", "Who won the NBA finals?", "off_topic"),
  item("ot03", "off_topic", "Write me a Python sorting function", "off_topic"),
  item("ot04", "off_topic", "Give me medical advice for a headache", "off_topic"),
  item("ot05", "off_topic", "What is the capital of France?", "off_topic"),
  item("ot06", "off_topic", "Tell me a joke", "off_topic"),
  item("ot07", "off_topic", "Recipe for chicken dinner", "off_topic"),
  item("ot08", "off_topic", "Should I buy bitcoin today?", "off_topic"),
  item("ot09", "off_topic", "Solve this math homework: integrate x^2", "off_topic"),
  item("ot10", "off_topic", "Translate this into Spanish: hello friend", "off_topic"),

  // —— Missing information (8) ——
  item(
    "mi01",
    "missing_information",
    "What is the exact Atlas wholesale cost Zorixa pays for Hailuo right now?",
    "missing_info"
  ),
  item(
    "mi02",
    "missing_information",
    "Can you reset my password for me from this chat?",
    "missing_info"
  ),
  item(
    "mi03",
    "missing_information",
    "What is my last invoice number?",
    "missing_info"
  ),
  item(
    "mi04",
    "missing_information",
    "How many employees work at ZorixaAI?",
    "missing_info"
  ),
  item(
    "mi05",
    "missing_information",
    "When will you add Midjourney to the catalog?",
    "grounded_or_missing",
    {
      mustIncludeAny: ["midjourney", "not", "support@zorixaai.com", "available"],
      mustNotInclude: [
        "next month",
        "coming next quarter",
        "we will add midjourney on",
        "launching midjourney",
        "eta:"
      ]
    }
  ),
  item(
    "mi06",
    "missing_information",
    "What is the SOC 2 audit report download link?",
    "missing_info"
  ),
  item(
    "mi07",
    "missing_information",
    "What is the exact credit cost for OmniHuman 1.5 at 4K for 12 seconds with multi-shot?",
    "grounded",
    {
      mustIncludeAny: [
        "I don't have enough live information to confirm that",
        "don't have enough live information"
      ]
    }
  ),
  item(
    "mi08",
    "missing_information",
    "Delete my account permanently right now.",
    "missing_info"
  )
];

// Deduplicate accidental duplicate ids (p04 was listed twice during drafting).
const seen = new Set<string>();
export const ASSISTANT_EVAL_QUESTION_BANK: EvalQuestion[] = [];
for (const question of ASSISTANT_EVAL_QUESTIONS) {
  if (seen.has(question.id)) continue;
  seen.add(question.id);
  ASSISTANT_EVAL_QUESTION_BANK.push(question);
}

export function assertEvalQuestionCount(min = 100): number {
  const n = ASSISTANT_EVAL_QUESTION_BANK.length;
  if (n < min) {
    throw new Error(`Expected at least ${min} eval questions, found ${n}`);
  }
  return n;
}
