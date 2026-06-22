# Zorixa AI — Product Hunt Launch Asset Specs

Export-ready layout specifications for Canva, Figma, or manual polish.
Generated assets live in `public/product-hunt/`.

---

## Brand tokens

| Token | Value | Use |
|-------|-------|-----|
| Background | `#080810` | Primary canvas |
| Elevated | `#0d0d14` | Panels, cards |
| Accent cyan | `#00d1ff` | CTA, links, highlights |
| Accent soft | `#7ee9ff` | Badge text |
| Accent purple | `#8b5cf6` | Gradient end, glow |
| Text primary | `#ffffff` | Headlines |
| Text muted | `#a1a1aa` | Subheads |
| Display font | **Space Grotesk** 700 | Headlines, wordmark |
| Body font | **DM Sans** 500–600 | Subheads, labels |

**Google Fonts import:**
```
https://fonts.google.com/share?selection.family=DM+Sans:wght@500;600;700|Space+Grotesk:wght@600;700
```

**Logo files:** `public/zorixa-icon.png` (512×512) · `public/zorixa-z-letter.png`

**Hero screenshot:** `.tmp/ph-screenshots/01_video_model_picker.png`

---

## 1. Product Hunt thumbnail — 240×240

**File:** `ph-thumbnail-240.png`

| Element | Position (px) | Size | Typography / asset |
|---------|---------------|------|---------------------|
| Canvas | 0, 0 | 240×240 | Fill `#080810` + cyan/purple radial glow |
| Logo | 36, 28 | 168×168 | `zorixa-icon.png`, contain |
| Wordmark | center x=120, y=222 | — | Space Grotesk **700**, 13px, 0.04em tracking, `#ffffff` |

**Canva:** Custom size 240×240 → center logo → optional text below.

**Figma frame:** `PH / Thumbnail / 240`

---

## 2. Launch banner — 1500×500

**File:** `ph-banner-1500x500.png`

### Layout grid
- **Left text panel:** x 0–560 (padding 64px)
- **Right visual:** x 520–1500 (screenshot crop, right-aligned)
- **Fade overlay:** x 480–640 gradient to blend text ↔ image

| Element | x | y | Style |
|---------|---|---|-------|
| Badge pill | 64 | 56 | 248×34, radius 100, fill `#00d1ff` 10%, stroke 35% |
| Badge dot | 82 | 73 | 8×8, `#00d1ff` |
| Badge label | 96 | 78 | DM Sans 600, 13px, `#7ee9ff`, "LIVE ON PRODUCT HUNT" |
| Headline L1 | 64 | 148 | Space Grotesk 700, **46px**, `#fff`, "Zorixa AI is here" |
| Headline L2 | 64 | 198 | Space Grotesk 700, **46px**, gradient cyan→purple, "Multi-model AI video" |
| Subhead L1 | 64 | 248 | DM Sans 500, 18px, `#a1a1aa`, models line 1 |
| Subhead L2 | 64 | 276 | DM Sans 500, 18px, `#a1a1aa`, models line 2 |
| Price | 64 | 322 | DM Sans 600, 16px, `#fff`, "Plans from $9.99/mo · 1,000 credits" |
| CTA button | 64 | 352 | 220×48, radius 12, fill `#00d1ff` |
| CTA label | 174 | 382 | Space Grotesk 700, 16px, `#000`, "Open Video Studio →" |

**Screenshot placement:** crop `01_video_model_picker.png` to 980×500, align right, object-fit cover.

**Figma frame:** `PH / Banner / 1500×500`

---

## 3. Open Graph image — 1200×630

**File:** `ph-og-1200x630.png`

| Element | x | y | Style |
|---------|---|---|-------|
| Background | 0, 0 | 1200×630 | Blurred screenshot @ 35% brightness + 72% dark overlay |
| Logo icon | 72 | 72 | 72×72 |
| Wordmark | 156 | 118 | Space Grotesk 700, **42px**, "Zorixa AI" |
| Headline L1 | 80 | 210 | Space Grotesk 700, **52px**, "Multi-model AI video" |
| Headline L2 | 80 | 272 | Space Grotesk 700, **52px**, gradient, "& image studio" |
| Subhead | 80 | 330 | DM Sans 500, 22px, model list |
| Divider | 80 | 368 | 1040×1, white 10% |
| Footer L1 | 80 | 418 | DM Sans 600, 20px, credits line |
| Footer L2 | 80 | 452 | DM Sans 500, 18px, pricing line |
| URL | 80 | 548 | Space Grotesk 700, 24px, `#00d1ff`, zorixaai.com/video |

**Figma frame:** `PH / OG / 1200×630`

---

## 4. Gallery upload order (1270×760)

Use screenshots from `.tmp/ph-screenshots/` — resize to **1270×760** if needed.

1. `01_video_model_picker.png`
2. `06_model_picker.png`
3. `02_ai_director.png`
4. `03_image_to_video.png`
5. `04_reference_to_video.png`
6. `01_image_model_picker.png`
7. `07_pricing.png`
8. `05_audio_to_video.png`

Copy + titles: see final gallery kit in chat / docs.

---

## 5. Canva quick setup

1. **Thumbnail:** Design → Custom size 240×240 → upload `zorixa-icon.png` → Effects → glow optional.
2. **Banner:** Custom 1500×500 → upload generated PNG as base OR rebuild with spec table.
3. **OG:** Custom 1200×630 → import `ph-og-1200x630.png` → tweak if needed.

**Font substitutes in Canaca if Space Grotesk unavailable:** Montserrat (headlines), Inter (body).

---

## 6. Export settings

| Asset | Format | Size | Max file |
|-------|--------|------|----------|
| Thumbnail | PNG | 240×240 | < 500 KB |
| Banner | PNG or JPG 90% | 1500×500 | < 2 MB |
| OG | PNG or JPG 90% | 1200×630 | < 1 MB |
| Gallery | PNG or JPG 90% | 1270×760 | < 2 MB each |

---

## Production claims (verified)

- Plans: $9.99 / $25.99 / $42.99 / $69.99 per month
- Credits: 1,000 / 3,200 / 5,600 / 10,000 per month
- No free credits on signup
- 30+ AI models (pricing page copy)
- Video models as shown in screenshots
