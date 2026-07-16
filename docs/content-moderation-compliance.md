# Zorixa AI — Content Moderation Compliance Report

**Last updated:** July 17, 2026  
**Status:** Server-side text + media enforcement active (global, provider-agnostic)

## Summary

Zorixa AI implements a **centralized server-side moderation layer** that screens every user prompt **and uploaded/reference media** **before** any image or video generation request is dispatched to upstream providers (Atlas Cloud, BytePlus, Hailuo, Kling, Seedance, Vidu, Wan, Veo, Grok, Gemini, etc.). Routing and model selection are unchanged — moderation is a hard gate in front of them.

Violations return a friendly HTTP 422 validation error and are logged for review.

**Blocked response (HTTP 422):**

```json
{
  "error": "This prompt can't be used — it violates ZorixaAI's content policy. Please try a different description without explicit or sexual content.",
  "code": "CONTENT_POLICY_VIOLATION"
}
```

## Protected API routes

| Route | Workflow | Enforcement point |
|-------|----------|-------------------|
| `POST /api/generate-image` | `image_generation` | Text + **reference images (I2I)**; **before** credits / Atlas |
| `POST /api/generate-video` | `video_generation` | Text + **I2V / R2V / V2V / start-end media**; **before** auth credits / Atlas / BytePlus |
| `POST /api/generate-video` | `ugc_generation` | Same route; UGC-style prompts tagged in workflow log |
| `POST /api/generate-video` | `character_swap` | `action=motion-control` — text + **character image + motion video** |
| `POST /api/enhance` | `image_enhance` | SDXL creative prompts + negative prompts |
| `POST /api/video` | `legacy_video` | Description + **start/end images** |
| `POST /api/generations/video` | `video_generation` | Motion prompt + **uploaded start frame** |

**Media classifier:** Atlas Cloud `google/gemini-2.5-flash-lite` (`lib/content-moderation/moderate-media.ts`). Labels `NUDITY` / `SEXUAL` → HTTP 422; classifier outage → HTTP 503 fail-closed.

**Not media-screened:** pure image/video upscale-only actions and background removal (no generative transform from user media intent beyond resolution).

## Blocked categories

| Category | Examples of blocked intent |
|----------|----------------------------|
| `nsfw` | NSFW, adult-only requests |
| `pornography` | Porn, XXX, hentai, sex tapes/videos, hardcore sexual content |
| `nudity` | Nude, naked, topless, undress, strip, exposed genitals/breasts |
| `sexual_content` | Sexual acts, fetish/BDSM, intercourse, explicit slang, erotic generation |
| `child_exploitation` | CSAM-related terms, underage sexual content, loli/shota |
| `deepfake_impersonation` | Deepfake, face swap, nudify, non-consensual imagery |
| `illegal_content` | Bomb-making, terrorism, trafficking, bestiality, incest, rape |

Safe artistic / fashion / swimwear / fitness / medical / educational phrasing (e.g. `nude makeup`, `sex education`, swimsuit catalogs, anatomy textbooks) is strip-allowlisted so it does not false-positive.

Implementation: `lib/content-moderation/moderate-prompt.ts` (normalized keyword / pattern matching).

## Enforcement architecture

```
User prompt + media URLs
        → enforceContentPolicy()      (text keywords / obfuscation squash)
        → enforceMediaContentPolicy() (vision NSFW classifier)
                ├─ block → HTTP 422 (no credits, no Atlas)
                └─ pass  → auth → credits → Atlas / BytePlus / Replicate
```

**Core modules:**

- `lib/content-moderation/moderate-prompt.ts` — text classification
- `lib/content-moderation/moderate-media.ts` — image/video vision classification
- `lib/content-moderation/enforce.ts` / `enforce-media.ts` — route guards + HTTP responses
- `lib/content-moderation/log-block.ts` — audit logging
- `supabase/migrations/20260611120000_moderation_blocks.sql` — `moderation_blocks` table

## Policy pages

| Page | URL |
|------|-----|
| Acceptable Use Policy | `/acceptable-use` |
| Terms of Service (acceptable use section) | `/terms` |
| Report abuse | `/abuse` |
| Privacy Policy | `/privacy` |
| Refund Policy | `/refund` |

## Verification

```bash
npm run test:moderation
npm run verify:content-moderation
```

Unit tests: `lib/content-moderation/moderate-prompt.test.ts`  
Route bypass check: every generation route must call `enforceContentPolicy`.

Apply DB migration (Supabase SQL Editor or CLI):

```bash
# File: supabase/migrations/20260611120000_moderation_blocks.sql
```

## Dodo / TAAFT response template

> We implemented a global, provider-agnostic server-side moderation layer across all image and video generation workflows (including Hailuo, Kling, Seedance, Vidu, Wan, and others). Every prompt is screened before any provider is called; policy violations return a friendly validation error and are logged. Our Acceptable Use Policy is published at https://www.zorixaai.com/acceptable-use.
