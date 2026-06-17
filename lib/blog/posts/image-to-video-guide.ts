import type { BlogPost } from "@/lib/blog/types";

export const imageToVideoGuidePost: BlogPost = {
  slug: "image-to-video-guide",
  title: "Image to Video Guide: Animate Still Images with AI",
  description:
    "How to use Image to Video on Zorixa AI — start frames, motion prompts, model tips for Seedance, Kling, and Hailuo, plus common mistakes.",
  publishedAt: "2026-06-17",
  readingTimeMinutes: 8,
  tags: ["image-to-video", "tutorial", "I2V"],
  relatedModelSlugs: ["seedance-2", "kling-3-pro", "hailuo-2-3", "vidu-q3"],
  relatedPostSlugs: ["text-to-video-guide", "how-to-create-ugc-videos-with-ai"],
  sections: [
    {
      id: "what-is-i2v",
      title: "What is Image to Video?",
      paragraphs: [
        "Image to Video (I2V) animates a still frame — product photo, portrait, or key art — into a short clip. Upload a start image, describe motion, and pick a model in the [[video studio|/video]].",
        "This is the fastest path to consistent character or product looks because the first frame is locked."
      ]
    },
    {
      id: "prepare-image",
      title: "Prepare your start frame",
      paragraphs: ["Better inputs mean better motion:"],
      bullets: [
        "Use sharp, well-lit images (avoid heavy blur)",
        "Leave room for motion — don’t crop too tight",
        "Generate stills in [[Zorixa Image|/image]] if you don’t have art yet",
        "For UGC, use a front-facing portrait ([[Hailuo|/models/hailuo-2-3]])"
      ]
    },
    {
      id: "motion-prompts",
      title: "Writing motion prompts",
      paragraphs: [
        "The image sets identity; the prompt sets movement. Describe camera and subject motion separately: “Camera slowly pushes in while hair moves in wind.”",
        "For [[Seedance 2.0|/models/seedance-2]] and [[Kling 3 Pro|/models/kling-3-pro]], you can combine I2V with multi-shot or longer durations where supported."
      ]
    },
    {
      id: "models",
      title: "Best models for I2V",
      paragraphs: ["On Zorixa AI:"],
      bullets: [
        "Product & reference → [[Vidu Q3|/models/vidu-q3]]",
        "Cinematic → [[Seedance 2.0|/models/seedance-2]]",
        "Action / ads → [[Kling 3 Pro|/models/kling-3-pro]]",
        "UGC portraits → [[Hailuo 2.3|/models/hailuo-2-3]]"
      ]
    },
    {
      id: "next-steps",
      title: "Next steps",
      paragraphs: [
        "When you need multiple reference clips, upgrade to Reference to Video on [[Seedance|/models/seedance-2]]. Read our [[Text to Video guide|/blog/text-to-video-guide]] for pure prompt workflows."
      ]
    }
  ]
};
