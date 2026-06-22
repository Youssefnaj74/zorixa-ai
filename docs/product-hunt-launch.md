# Zorixa AI — Product Hunt Submission Package

**Production URL:** https://www.zorixaai.com  
**Primary CTA:** https://www.zorixaai.com/video  
**Pricing:** https://www.zorixaai.com/pricing  
**Support:** support@zorixaai.com  

*Verified against production codebase and live app — June 2026.*  
*Visual assets: `public/product-hunt/` · Regenerate: `node scripts/generate-ph-launch-assets.mjs`*

---

## Accuracy guardrails

| Do not claim | Why |
|--------------|-----|
| Free credits on signup | Signup is free; **0 credits** until purchase |
| Unlimited generations | All runs spend credits |
| Explore Prompts gallery | `EXPLORE_PROMPTS_PUBLIC = false` — not public |
| Team workspaces / collaboration | Not in production |
| Native mobile app | Web only |
| Runway / Pika as included models | Competitors, not offered models |

**Production naming:** Kling **3.0 Pro** (not “Kling 3 Pro”) · Nav label **Speech** for TTS (`/audio`) · Page title “Text to Speech”

---

## 1. Final Product Hunt tagline

**Primary (58 characters):**

```
Multi-model AI video studio — pay only for what you generate
```

**Alternate (52 characters):**

```
One studio for Kling, Veo, Seedance, Hailuo & more
```

Use the **primary** tagline in the PH tagline field. The thumbnail image carries the brand; keep on-image text minimal (`Zorixa AI` only).

---

## 2. Final short description

Paste into PH **Short description** (~260 characters):

```
Zorixa AI is a web studio for AI image, video, and text-to-speech generation. Pick from 30+ models — Kling 3.0 Pro, Google Veo 3.1, Seedance 2.0, Hailuo 2.3, Grok Imagine, Flux, GPT Image 2, and more — in one dashboard. Credits are shown before every generation. Plans from $9.99/mo.
```

*(259 characters)*

---

## 3. Final long description

Paste into PH **Description** (Markdown supported):

### The problem

AI video creators juggle multiple tools, accounts, and pricing pages. Costs stay opaque until after you click generate.

### The solution

**Zorixa AI** is one web studio for multi-model AI image and video generation — built for creators, marketers, and agencies who want model choice without managing separate APIs.

### What you can do today

**Video studio** (`/video`) — six workflows:

- ✨ **AI Director** — automatic model routing from your prompt
- **Text to Video**
- **Image to Video**
- **Reference to Video** (Seedance 2.0, Gemini Omni Flash, Grok Imagine, Vidu Q3, Wan 2.7, HappyHorse, Google Veo 3.1)
- **Video to Video** (character swap, motion control, video edit)
- **Audio to Video** (InfiniteTalk, VEED Fabric 1.0)

**Video models in production:**  
Grok Imagine · Gemini Omni Flash · **Kling 3.0 Pro** · Kling 2.6 Motion · **Seedance 2.0** · Seedance 1.5 Pro · Wan 2.6 · Wan 2.7 · Wan 2.2 Character Swap · HappyHorse 1.0 · **Hailuo 2.3** · **Google Veo 3.1** · Vidu Q3 · Vidu Q3-Pro

**Image studio** (`/image`):  
GPT Image 2 · Nano Banana 2 & Pro · Flux (Dev, Schnell, Kontext, LoRA) · Seedream 5 Lite · Grok Imagine · Wan 2.6 / 2.7 Image · Qwen 2.0 Pro

**Speech studio** (`/audio`):  
ElevenLabs voices — generate voiceover, then send to Audio to Video for lipsync.

**Also included:**

- Credit balance in navbar
- Generation **History** with downloads
- **Tools** catalog (`/tools`)
- **MCP API keys** for Cursor (`/dashboard/api`)
- Content moderation on prompts

### Pricing

Credit packs via **Dodo Payments** — monthly or yearly billing (−10% on yearly):

| Plan | Monthly | Yearly (per mo) | Credits / month |
|------|---------|-----------------|-----------------|
| **Starter** | $9.99 | $8.99 | 1,000 |
| **Pro** | $25.99 | $23.39 | 3,200 |
| **Creator** ⭐ | $42.99 | $38.69 | 5,600 |
| **Ultra** | $69.99 | $62.99 | 10,000 |

- **Free account** — sign up at `/login?mode=signup`
- **No free credits** on signup — buy a pack when ready to generate
- Unused credits stay on your account
- Exact credit cost shown on the Generate button before each run

**Example credit costs** (default ~5s video / 2K image — varies by settings):

| Model | Credits |
|-------|---------|
| Flux Dev (image) | 9 |
| Text-to-speech | 23 |
| Hailuo 2.3 (video) | 115 |
| Seedance 2.0 (video) | 151 |
| Kling 3.0 Pro (video) | 169 |
| Google Veo 3.1 (video) | 234 |

~1,000 credits ≈ ~6 Seedance 2.0 videos or ~111 Flux Dev images (pricing page estimate).

### Who it's for

- Performance marketers testing UGC hooks & product video
- Content creators who want Kling + Seedance + Hailuo in one tab
- Agencies tired of stacking separate video, image, and voice tools
- Cursor users who want MCP access to generation

### Links

- 🌐 https://www.zorixaai.com
- 🎬 Video studio: https://www.zorixaai.com/video
- 💰 Pricing: https://www.zorixaai.com/pricing
- 📧 Support: support@zorixaai.com

---

## 4. Final maker comment

Post as the **first comment** within 5 minutes of publishing:

```
Hey Product Hunt 👋

I'm the maker of Zorixa AI.

I built this because I was tired of switching between AI video tools — different logins, different credit systems, no idea what a clip would cost until after I clicked generate.

Zorixa AI puts 30+ image and video models in one studio:
• ✨ AI Director, Text/Image/Reference/Video-to-Video/Audio to Video
• Kling 3.0 Pro, Google Veo 3.1, Seedance 2.0, Hailuo 2.3, Grok Imagine, Flux, GPT Image 2, and more
• Credits shown before you generate

Honest note: signup is free, but there are no free credits — plans start at $9.99/mo for 1,000 credits. I'd rather be transparent than bait-and-switch.

Would love your feedback:
1. Which model do you reach for first — Kling, Seedance, or Hailuo?
2. What's missing for your workflow?

Try it → https://www.zorixaai.com/video

Thanks for checking us out 🙏
```

---

## 5. Product Hunt categories

| Field | Selection |
|-------|-----------|
| **Primary category** | Artificial Intelligence |
| **Secondary category** | Design Tools |

**Rationale:** AI video/image generation is the core product. Design Tools captures creative workflows (ads, UGC, product visuals) without mislabeling as a developer-only tool.

**If only one category is allowed:** Artificial Intelligence

---

## 6. Product Hunt topics / tags

Add these in the **Topics** field (pick all that apply; PH allows multiple):

```
Artificial Intelligence
Video
Generative AI
SaaS
Marketing
Content Creation
Design Tools
Productivity
Startups
No-Code
```

**Suggested priority order (first 5 if limited):** Artificial Intelligence · Video · Generative AI · SaaS · Marketing

---

## 7. Launch day checklist

### Assets (ready in repo)

- [x] Thumbnail **240×240** → `public/product-hunt/ph-thumbnail-240.png`
- [x] Banner **1500×500** → `public/product-hunt/ph-banner-1500x500.png`
- [x] OG image **1200×630** → `public/product-hunt/ph-og-1200x630.png`
- [x] Layout spec → `public/product-hunt/LAYOUT-SPEC.md`
- [ ] Gallery **8 screenshots** (1270×760) — source: `.tmp/ph-screenshots/` (see gallery section below)
- [ ] Tagline, short + long description pasted from this doc
- [ ] Maker comment drafted and ready to paste
- [ ] PH listing URL saved for banner CTA swap

### Before launch (T-7 to T-1)

- [ ] Product Hunt maker profile complete (photo, bio, social links)
- [ ] Test live flow: signup → `/pricing` → checkout → `/video` → generate
- [ ] Confirm Dodo Payments checkout works in production
- [ ] Prepare 3–5 demo prompts that work reliably (Hailuo UGC, Seedance cinematic, Flux product still)
- [ ] Pre-write replies for common questions (pricing, free credits, vs Runway)

### Launch day — Hour 0

- [ ] Publish on Product Hunt (12:01 AM PT optional for max visibility)
- [ ] Post **maker comment** within 5 minutes
- [ ] Share on **X** (post below)
- [ ] Share on **LinkedIn** (post below)
- [ ] Reply to every PH comment within 30–60 minutes
- [ ] Monitor support@zorixaai.com and checkout errors

### Launch day — Hour 1–24

- [ ] Pin PH link on X / LinkedIn bio temporarily
- [ ] Track signups + `pricing_viewed` + `checkout_started` in PostHog
- [ ] Watch for insufficient-credits UX issues on new users
- [ ] Share user-generated outputs (with permission) as replies
- [ ] Thank upvoters who leave feedback

### After launch (T+1 to T+7)

- [ ] Publish “We launched on Product Hunt” recap on X / LinkedIn
- [ ] Add top PH feedback to roadmap
- [ ] Follow up with users who signed up but didn't purchase
- [ ] Document conversion: PH visit → signup → paid pack
- [ ] Request PH reviews from happy users (day 3–5)

### Do NOT say on launch day

- ❌ “Free credits included”
- ❌ “Unlimited generations”
- ❌ “Replace Runway entirely” (position as multi-model alternative)
- ❌ “Explore Prompts gallery live”
- ❌ “Team collaboration built-in”

---

## 8. X launch post

**Option A — with demo clip (recommended)**

```
We're live on Product Hunt 🚀

Zorixa AI — one studio for AI video & images.

Kling 3.0 Pro · Google Veo 3.1 · Seedance 2.0 · Hailuo 2.3 · Flux · GPT Image 2 & 30+ more models.

✨ AI Director picks the model for you
Credits shown before every generation
Plans from $9.99/mo

Would mean a lot if you checked us out + left feedback 👇
[PRODUCT HUNT LINK]

Try the studio → https://www.zorixaai.com/video
```

**Option B — text + banner image**

Attach `public/product-hunt/ph-banner-1500x500.png`. Same copy as Option A; replace `[PRODUCT HUNT LINK]` with your live PH URL after publish.

**Hashtags (optional, 2–3 max):** `#ProductHunt` `#AIVideo` `#BuildInPublic`

---

## 9. LinkedIn launch post

```
Today we're launching Zorixa AI on Product Hunt.

The problem I kept hitting: AI video creators juggle Runway for one clip, another tool for UGC, a third for images — and you never know the cost until after you generate.

So I built Zorixa AI — one web studio with 30+ models in a single credit wallet:

→ Video: Kling 3.0 Pro, Google Veo 3.1, Seedance 2.0, Hailuo 2.3, Grok Imagine, Vidu Q3, and more
→ Image: Flux, GPT Image 2, Nano Banana, Seedream, Grok Imagine
→ Speech: ElevenLabs voices, then Audio to Video lipsync
→ ✨ AI Director routes your prompt to the right model automatically

Six video workflows: Text, Image, Reference, Video-to-Video, and Audio to Video — credits shown on the Generate button before you spend.

Pricing is straightforward: plans from $9.99/mo for 1,000 credits. Signup is free; no free credits — I'd rather be honest than bait-and-switch.

If you work in performance marketing, content creation, or agencies — I'd love your take.

🔗 Product Hunt: [PRODUCT HUNT LINK]
🎬 Try it: https://www.zorixaai.com/video

What model would you reach for first — Kling, Seedance, or Hailuo?
```

Attach `ph-banner-1500x500.png` or a gallery screenshot (Slide 1: Seedance 2.0 output).

---

## Gallery — upload order, titles, descriptions

**Recommended size:** 1270×760 PNG or JPG  
**Source files:** `.tmp/ph-screenshots/`

| # | File | PH title |
|---|------|----------|
| 1 | `01_video_model_picker.png` | AI video studio — generate with Seedance 2.0 |
| 2 | `06_model_picker.png` | 12+ video models — Kling, Veo, Grok & more |
| 3 | `02_ai_director.png` | AI Director picks the best model for your scene |
| 4 | `03_image_to_video.png` | Image to Video — animate product shots & portraits |
| 5 | `04_reference_to_video.png` | Reference to Video with Seedance 2.0 |
| 6 | `01_image_model_picker.png` | Image studio — Flux, GPT Image 2, Nano Banana |
| 7 | `07_pricing.png` | Credit pricing from $9.99/mo — no surprises |
| 8 | `05_audio_to_video.png` | Audio to Video lipsync with InfiniteTalk |

### Gallery descriptions (PH caption field)

**1 — Video Studio Overview**  
Text-to-video in one studio. This run used Seedance 2.0 (9:16, 5s, 720p) — 151 credits shown on Generate before you spend. Upscale, Extend, and session History built in.

**2 — Video Model Picker**  
One account, many engines: Grok Imagine, Gemini Omni Flash, Kling 3.0 Pro, Seedance 2.0, Hailuo 2.3, Google Veo 3.1, Vidu Q3, Wan 2.7, and more — switch models per clip, not per subscription.

**3 — AI Director**  
Describe your scene once. AI Director routes to the right model (here: Vidu Q3-Pro at 290 credits), with Style, Quality, duration, and soundtrack controls. Tap WHY? to see the reasoning.

**4 — Image to Video**  
Upload a start frame (and optional end frame), write your prompt, generate motion. Works with Seedance 2.0, Seedance 1.5 Pro, and other I2V models — ideal for product and UGC-style ads.

**5 — Reference to Video**  
Seedance 2.0 Reference to Video — combine up to 9 images, 3 videos, and 3 audio references. Prompts auto-tag @image1, @video1 for character, motion, and mood control.

**6 — Image Studio**  
Text to Image and Image to Image with GPT Image 2, Nano Banana 2, Flux Dev, Seedream 5, Grok Imagine, Wan 2.7, and more. Upscale, Variations, and 2K exports — same credit wallet as video.

**7 — Pricing**  
Monthly credit subscriptions from $9.99 (1,000 credits) to $69.99 (10,000 credits). Credits stack until you use them. Per-generation rates listed on the same page. Yearly billing: −10%.

**8 — Audio to Video**  
Upload a portrait + audio, add a prompt, generate a talking clip with InfiniteTalk (720p). Pair with Speech studio (ElevenLabs voices) for full voiceover → lipsync workflows.

---

## Visual assets reference

| Asset | Path | Dimensions |
|-------|------|------------|
| PH thumbnail | `public/product-hunt/ph-thumbnail-240.png` | 240×240 |
| Launch banner | `public/product-hunt/ph-banner-1500x500.png` | 1500×500 |
| Open Graph | `public/product-hunt/ph-og-1200x630.png` | 1200×630 |
| Figma/Canva spec | `public/product-hunt/LAYOUT-SPEC.md` | — |
| Logo source | `public/zorixa-icon.png` | 512×512 |

---

## FAQ (for PH comments & social replies)

**Is Zorixa AI free?**  
Signup is free. Generations require credits — plans start at $9.99/mo for 1,000 credits. No free credits on signup.

**How is this different from Runway?**  
Runway is one vendor. Zorixa is a multi-model studio — Kling, Veo, Seedance, Hailuo, Vidu, Grok, Gemini Omni Flash, and more — with one credit balance.

**Which video models are available?**  
Kling 3.0 Pro, Kling 2.6 Motion, Seedance 2.0, Seedance 1.5 Pro, Google Veo 3.1, Hailuo 2.3, Wan 2.6/2.7, HappyHorse 1.0, Vidu Q3/Q3-Pro, Grok Imagine Video, Gemini Omni Flash, plus Audio-to-Video tools. Full list on `/tools` and `/pricing`.

**How do credits work?**  
Each generation deducts credits based on model and settings. Cost is shown before you click Generate. Unused credits remain on your account.

**How much does a typical video cost?**  
Varies by model — e.g. ~115 credits (Hailuo 2.3), ~151 (Seedance 2.0), ~169 (Kling 3.0 Pro), ~234 (Veo 3.1) for a default ~5s clip.

**Is there an API?**  
Yes — MCP API keys in the dashboard (`/dashboard/api`) for Cursor integration. Uses your credit balance.

**Do you offer refunds?**  
Credits are generally non-refundable once purchased, except where required by law. Billing issues → billing@zorixaai.com.

---

## Submission field quick reference

| PH field | Value |
|----------|-------|
| **Name** | Zorixa AI |
| **Tagline** | Multi-model AI video studio — pay only for what you generate |
| **Website** | https://www.zorixaai.com |
| **Short description** | See §2 above |
| **Description** | See §3 above |
| **Thumbnail** | `ph-thumbnail-240.png` |
| **Gallery** | 8 screenshots — see Gallery section |
| **Category** | Artificial Intelligence (+ Design Tools) |
| **Topics** | See §6 above |
| **Pricing** | Paid — subscription from $9.99/mo |
| **First comment** | See §4 above |

---

*Last updated: June 2026 · Production-verified*
