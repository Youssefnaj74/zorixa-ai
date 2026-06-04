/** Public FAQ — indexed for users, support, and FAQPage JSON-LD on /faq. */
export type PublicFaqItem = { q: string; a: string };

export const PUBLIC_FAQ_ITEMS: PublicFaqItem[] = [
  {
    q: "What is Zorixa AI?",
    a: "Zorixa AI is a web studio for AI image and video generation. It brings multiple leading models—such as GPT Image 2, Flux, Seedream, Kling, Google Veo, Hailuo, and Wan—into one dashboard with credits-based pricing, history, and exports."
  },
  {
    q: "Who founded Zorixa AI?",
    a: "Zorixa AI was built by an independent founder focused on practical creator workflows: fast iteration, clear pricing, and access to premium video models without juggling many separate APIs."
  },
  {
    q: "Where is Zorixa AI based?",
    a: "Zorixa AI operates as a remote-first product. Payments are processed globally through Lemon Squeezy; support is available in English via email."
  },
  {
    q: "Is Zorixa AI safe to use?",
    a: "We use industry-standard auth, HTTPS, and a trusted payment processor. Do not upload sensitive personal data you do not want processed by third-party AI providers. See our Privacy Policy for details."
  },
  {
    q: "Can I use Zorixa AI output commercially?",
    a: "Under our Terms, you retain ownership of content you create. You are responsible for complying with each model provider’s policies and applicable law. Paid plans are intended for professional creator use."
  },
  {
    q: "How does Zorixa AI compare to Runway or Pika?",
    a: "Runway and Pika are strong single-brand video tools. Zorixa is an aggregator: one account, one credit balance, and many models (Kling, Veo, Seedance, Hailuo, Vidu, and more) with transparent per-generation credit costs."
  },
  {
    q: "How do credits work?",
    a: "Each image or video generation spends credits based on the model and settings (duration, resolution, etc.). Your balance appears in the navbar. Buy packs on the Pricing page; unused credits stay on your account."
  },
  {
    q: "What models are available on Zorixa AI?",
    a: "Image: GPT Image 2, Nano Banana, Flux, Seedream, Grok Imagine, Wan, and more. Video: Kling, Google Veo, Seedance, Hailuo, Wan, HappyHorse, Vidu, Gemini Omni Flash, Grok Imagine Video, and audio-to-video tools. See Tools for the full list."
  },
  {
    q: "How long do video generations take?",
    a: "Most clips finish in about 1–5 minutes depending on model and length. Reference-to-video and premium models can take longer. Check History for status and downloads."
  },
  {
    q: "Does Zorixa AI offer refunds?",
    a: "Credits are generally non-refundable once purchased, except where required by law. Billing issues or platform bugs should be reported via Support with your receipt."
  },
  {
    q: "Is Zorixa AI still in beta?",
    a: "Zorixa AI is publicly available with ongoing improvements. Features and models may change; we announce major updates through the product and support channels."
  },
  {
    q: "How do I contact Zorixa AI?",
    a: "General: hello@zorixaai.com (Contact page). Technical & account: support@zorixaai.com (Support page). Billing: billing@zorixaai.com. Privacy: privacy@zorixaai.com."
  }
];
