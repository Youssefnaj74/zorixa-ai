import type { BlogPost } from "@/lib/blog/types";

export const ugcVideosWithAiPost: BlogPost = {
  slug: "how-to-create-ugc-videos-with-ai",
  title: "How to Create UGC Videos with AI (2026 Workflow)",
  description:
    "Step-by-step guide to AI UGC videos using Hailuo 2.3 and Zorixa AI — hooks, portraits, AI Director UGC style, and iteration tips for paid social.",
  publishedAt: "2026-06-17",
  readingTimeMinutes: 7,
  tags: ["UGC", "Hailuo", "tutorial", "social media"],
  relatedModelSlugs: ["hailuo-2-3", "seedance-2", "kling-3-pro"],
  relatedPostSlugs: ["best-ai-video-generator-2026", "image-to-video-guide"],
  sections: [
    {
      id: "what-is-ai-ugc",
      title: "What is AI UGC?",
      paragraphs: [
        "UGC-style video looks like a creator filmed on a phone — direct address, natural motion, product in hand. AI UGC uses text or a portrait image to generate that feel without a full shoot.",
        "On Zorixa AI, [[Hailuo 2.3|/models/hailuo-2-3]] is the go-to for social-first clips. AI Director also routes UGC-style prompts to Hailuo automatically."
      ]
    },
    {
      id: "workflow",
      title: "Step-by-step workflow",
      paragraphs: ["Follow this loop for TikTok, Reels, and Meta ads:"],
      bullets: [
        "Write a hook-first prompt (first 2 seconds matter)",
        "Choose Image to Video if you have a brand avatar or product still",
        "Select Hailuo 2.3 in the [[video studio|/video]] or use AI Director → UGC",
        "Generate 5–8 second variants; pick the best motion",
        "Download from History and edit captions in your NLE"
      ]
    },
    {
      id: "prompt-tips",
      title: "Prompt tips that work",
      paragraphs: [
        "Be specific about camera (handheld, selfie angle), lighting (natural window light), and action (unboxing, talking to camera). Avoid copyrighted characters and real celebrity names — Zorixa enforces content policy before generation."
      ],
      bullets: [
        "“Young creator holding skincare bottle, selfie angle, natural smile, soft daylight”",
        "“UGC testimonial, medium close-up, subtle head movement, authentic bedroom background”"
      ]
    },
    {
      id: "when-not-hailuo",
      title: "When to use another model",
      paragraphs: [
        "Need reference video or cinematic motion? Try [[Seedance 2.0|/models/seedance-2]]. Need multi-shot ad structure? Use [[Kling 3 Pro|/models/kling-3-pro]]. See [[Image to Video guide|/blog/image-to-video-guide]] for start-frame workflows."
      ]
    }
  ]
};
