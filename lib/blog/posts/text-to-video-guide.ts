import type { BlogPost } from "@/lib/blog/types";

export const textToVideoGuidePost: BlogPost = {
  slug: "text-to-video-guide",
  title: "Text to Video Guide: How to Generate AI Videos from Prompts",
  description:
    "Learn Text to Video on Zorixa AI — prompting, aspect ratio, duration, model selection (Seedance, Kling, Hailuo), and credit tips.",
  publishedAt: "2026-06-17",
  readingTimeMinutes: 9,
  tags: ["text-to-video", "tutorial", "prompting"],
  relatedModelSlugs: ["seedance-2", "kling-3-pro", "hailuo-2-3"],
  relatedPostSlugs: ["image-to-video-guide", "seedance-2-vs-kling-3-pro"],
  sections: [
    {
      id: "basics",
      title: "Text to Video basics",
      paragraphs: [
        "Text to Video (T2V) turns a written scene description into a short clip. On [[Zorixa AI|/video]], open the studio, select the Text to Video tab, choose a model, and describe subject, camera, lighting, and motion.",
        "No upload required — pure prompt-driven generation."
      ]
    },
    {
      id: "prompt-structure",
      title: "Prompt structure",
      paragraphs: ["Strong T2V prompts usually include:"],
      bullets: [
        "Subject — who or what is on screen",
        "Action — what moves (walks, turns, explodes)",
        "Camera — tracking shot, drone, close-up",
        "Lighting & mood — golden hour, neon, soft studio",
        "Duration cue — “5 second shot” helps consistency"
      ]
    },
    {
      id: "model-choice",
      title: "Which model to pick",
      paragraphs: ["Start with one model per project type:"],
      bullets: [
        "[[Seedance 2.0|/models/seedance-2]] — cinematic, anime, longer clips",
        "[[Kling 3 Pro|/models/kling-3-pro]] — multi-shot ads, 1080p",
        "[[Hailuo 2.3|/models/hailuo-2-3]] — UGC and social",
        "Compare in [[Seedance vs Kling|/blog/seedance-2-vs-kling-3-pro]]"
      ]
    },
    {
      id: "settings",
      title: "Duration, aspect ratio, credits",
      paragraphs: [
        "Use the bottom bar to set seconds, resolution, and speed tier. Credits scale with model and duration — check the Generate button label before running a batch.",
        "Use History to re-download outputs. For image-driven motion, switch to [[Image to Video|/blog/image-to-video-guide]]."
      ]
    }
  ]
};
