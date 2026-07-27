/**
 * Static product knowledge injected into the ZorixaAI Assistant system prompt.
 * Keep this in sync with real product surfaces — never invent features here.
 */

export const ZORIXA_ASSISTANT_PRODUCT_DOCUMENTATION = `Zorixa AI (https://www.zorixaai.com) is a web studio for AI image and video generation.
It aggregates multiple models in one dashboard with credits-based pricing, history, and exports.
Payments are processed via Dodo Payments.

Key pages:
- Home: /
- Image studio: /image
- Video studio: /video
- Text-to-Speech (MiniMax): /audio
- Voice Clone studio: /audio/clones
- Tools catalog: /tools
- Pricing: /pricing
- FAQ: /faq
- Billing: /billing
- Dashboard API Access: /dashboard/api
- Help: /helpsupport
- Support: /support
- Terms: /terms
- Privacy: /privacy

Contact:
- General: hello@zorixaai.com
- Support: support@zorixaai.com
- Billing: billing@zorixaai.com
- Privacy: privacy@zorixaai.com
- Abuse: abuse@zorixaai.com

Commercial use: users retain ownership of content they create (see Terms). Users must comply with each model provider's policies and applicable law.

## Founder
Zorixa AI was built by an independent founder focused on practical creator workflows: fast iteration, clear pricing, and access to premium video models without juggling many separate APIs.
Zorixa AI operates as a remote-first product.

## Model strengths for prompt engineering (Zorixa video)
Use these when optimizing prompts or explaining model choice. Respect the user's selected/named model first.

Grok Imagine Video (ids: grok-imagine-video-t2v, grok-imagine-video-i2v-15, grok-imagine-video-r2v):
- Simple camera movement; one primary camera motion
- Natural language; UGC / social content
- Talking-head and creator-style clips with native audio

Kling 3.0 Pro (id: kling-3-pro):
- Complex camera choreography: orbit, push in, pull back, dolly, rack focus
- Cinematic lighting and multi-shot / linked camera beats
- Premium ads and hero shots

Seedance 2.0 (id: seedance-2):
- Strong character consistency
- Beautiful facial details
- Emotional cinematic scenes; reference-driven work

Seedance 1.5 Pro (id: seedance-1-5):
- Stylized / anime / fantasy motion
- Expressive movement

Hailuo 2.3 (id: hailuo-2-3):
- UGC, talking people, product reviews, selfie camera energy
- Fast social-native motion (silent / no native soundtrack on Zorixa)

Wan (ids: wan-2-6, wan-2-7, and related Wan tools):
- Stylized looks, anime-leaning creative motion, inventive camera energy

Vidu Q3 / Q3-Pro (ids: vidu-q3, vidu-q3-pro):
- Product-focused clips, clean motion, ad-ready polish

Google Veo 3.1 (id: google-veo-3-1):
- Premium cinematic / high-fidelity clips when the brief calls for Veo-class output

## Studios
Image Studio (/image) tabs:
- Text to Image
- Image to Image (upload a reference image to edit / restyle)
- Image Upscaler
Yes — you can edit images with a reference upload via the Image to Image tab.

Video Studio (/video) tabs:
- AI Director
- Text to Video
- Image to Video
- Reference to Video
- Video to Video (character swap)
- Audio to Video
Credits for a generation are shown in the studio before you click Generate. Typical video generations finish in about 1–5 minutes; premium/reference jobs can take longer. Check History for status and downloads.

## AI Director (Video Studio tab)
AI Director is an automatic video model router inside /video (not a separate page).
It picks a model and Text-to-Video vs Image-to-Video from style + prompt (and start image when present).
Styles: Auto, Cinematic, UGC, Product, Anime.
Quality presets: Fast (480p), Balanced (720p), Best Quality (720p, premium models).
Typical times: Fast 1–3 min, Balanced 2–5 min, Best 5–10 min.
Balanced style primary models:
- Cinematic → Seedance 2.0 (id: seedance-2)
- UGC → Grok Imagine Video (id: grok-imagine-video-t2v / grok-imagine-video-i2v-15)
- Product → Vidu Q3-Pro (id: vidu-q3-pro)
- Anime → Seedance 1.5 Pro (id: seedance-1-5)
Best Quality often routes to Kling 3.0 Pro (id: kling-3-pro) across styles.
UGC fallbacks include Hailuo 2.3 (id: hailuo-2-3).

## Text-to-Speech & Voice Cloning (MiniMax)
- TTS page: /audio — system voices, speed 0.5x–2.0x, max 10,000 characters per request, MP3 export.
- Voice Clone page: /audio/clones — upload mp3/m4a/wav, 10 seconds to 5 minutes, max 20 MB.
- Starter and higher credit packs include access to the text-to-speech studio.
- Exact TTS/clone credit costs are shown in the audio studio before you generate; if a precise number is not listed in the pricing section below, say you don't have that information and direct the user to support@zorixaai.com.

## API keys & Cursor MCP
- Create keys at Dashboard → API Access (/dashboard/api).
- Keys use the prefix zrx_live_ and are shown once on create.
- Max 5 active API keys per user.
- Use Authorization: Bearer zrx_live_YOUR_KEY for Zorixa REST APIs.
- Cursor MCP (zorixa-mcp): set ZORIXA_API_KEY to your zrx_live_ key and ZORIXA_API_BASE_URL=https://www.zorixaai.com.
- MCP tools: generate_image, generate_video, list_models, get_credits.
- Credits deduct from the same Zorixa account balance as the website.
- Atlas API keys stay on the server; customers only need a Zorixa API key.

## Common generation failures
- Not enough credits: message like "Not enough credits (need X, you have Y). View plans." — when answering, quote need/have from the live session / last generation error when present; otherwise direct the user to the credits next to Generate and /pricing. Never invent need/have numbers or manually recalculate costs.
- Pricing mismatch: if the Generate button credits differ from the backend required credits in the live session, say there is a pricing mismatch between the displayed credits and the backend calculation (likely a bug). Ask the user to refresh or contact support. Do not invent a root cause unless that cause is confirmed in live session fields.
- Content policy: "This prompt can't be used — it violates ZorixaAI's content policy. Please try a different description without explicit or sexual content."
- Provider/Atlas failures: retry, simplify the prompt, try Audio Off for video soundtrack issues, or check generation History. For account-specific failures, contact support@zorixaai.com.
- Credits are generally non-refundable once purchased (see FAQ), except where required by law.

## Billing notes
- Yearly billing is not available yet — only monthly subscriptions on /pricing.
- All paid packs unlock the same model catalog; higher packs simply include more monthly credits.
- New signups receive a small starter credit balance (about 100 credits) to try the studio before buying a pack.

## Account
- Credits balance appears in the navbar and in the current user session when signed in.
- Unused credits stay on the account.
- Password reset: use /forgot-password (also linked from the sign-in form). After the email link, set a new password on /reset-password.
- For login issues beyond reset, email changes, or payment disputes, contact support@zorixaai.com or billing@zorixaai.com.
- Questions about SOC 2 reports, employee headcount, invoice numbers, account deletion, wholesale Atlas costs, or unannounced roadmap dates are not available in this context — use the missing-information support reply.`;
