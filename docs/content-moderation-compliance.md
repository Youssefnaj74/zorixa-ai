# Zorixa AI — Content Moderation Compliance Report

**Last updated:** June 11, 2026  
**Status:** Server-side enforcement active

## Summary

Zorixa AI implements a **centralized server-side moderation layer** that screens user prompts before any image, video, UGC, or character-swap generation request is sent to upstream AI providers. Violations return a consistent error message and are logged for review.

**Blocked response (HTTP 422):**

```json
{
  "error": "This request violates ZorixaAI Content Policy.",
  "code": "CONTENT_POLICY_VIOLATION"
}
```

## Protected API routes

| Route | Workflow | Enforcement point |
|-------|----------|-------------------|
| `POST /api/generate-image` | `image_generation` | After auth; before credits / Atlas call |
| `POST /api/generate-video` | `video_generation` | After auth; before credits / Atlas call |
| `POST /api/generate-video` | `ugc_generation` | Same route; UGC-style prompts tagged in workflow log |
| `POST /api/generate-video` | `character_swap` | `action=motion-control` (Wan / Kling character workflows) |
| `POST /api/enhance` | `image_enhance` | SDXL creative prompts + negative prompts |
| `POST /api/video` | `legacy_video` | Legacy studio description field |
| `POST /api/generations/video` | `video_generation` | User-supplied motion prompt (form field) |

**Not moderated (no user text prompt):** video upscale (`action=upscale`), background removal, pure upscalers without prompts.

## Blocked categories

| Category | Examples of blocked intent |
|----------|----------------------------|
| `nsfw` | NSFW, adult-only requests |
| `pornography` | Porn, XXX, hentai, hardcore sexual content |
| `nudity` | Nude, naked, topless, undress, remove clothes |
| `sexual_content` | Explicit sex scenes, sexual acts, erotic generation |
| `child_exploitation` | CSAM-related terms, underage sexual content, loli/shota |
| `deepfake_impersonation` | Deepfake, face swap, nudify, non-consensual imagery |
| `illegal_content` | Bomb-making, terrorism, trafficking, bestiality, incest |

Implementation: `lib/content-moderation/moderate-prompt.ts` (normalized keyword / pattern matching).

## Enforcement architecture

```
User prompt → API route → enforceContentPolicy()
                              ├─ moderateTexts()  → block or pass
                              └─ logModerationBlock() → moderation_blocks table + server log
```

**Core modules:**

- `lib/content-moderation/moderate-prompt.ts` — classification
- `lib/content-moderation/enforce.ts` — route guard + HTTP response
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

Run locally:

```bash
npm run verify:content-moderation
```

Apply DB migration (Supabase SQL Editor or CLI):

```bash
# File: supabase/migrations/20260611120000_moderation_blocks.sql
```

## Dodo Payments response template

> We implemented server-side moderation controls across all image, video, UGC, and character-related generation workflows. Prompts are screened before reaching AI providers; policy violations are blocked with a standard message and logged for review. Our Acceptable Use Policy is published at https://www.zorixaai.com/acceptable-use.
