/**
 * Generate Product Hunt launch assets from gallery screenshots + brand files.
 * Run: node scripts/generate-ph-launch-assets.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "product-hunt");
const SCREENSHOT = path.join(ROOT, ".tmp", "ph-screenshots", "01_video_model_picker.png");
const ICON = path.join(ROOT, "public", "zorixa-icon.png");

const BRAND = {
  bg: "#080810",
  bgElevated: "#0d0d14",
  cyan: "#00d1ff",
  cyanSoft: "#7ee9ff",
  purple: "#8b5cf6",
  white: "#ffffff",
  muted: "#a1a1aa",
  mutedDark: "#71717a",
  displayFont: "Space Grotesk, Segoe UI, system-ui, sans-serif",
  bodyFont: "DM Sans, Segoe UI, system-ui, sans-serif"
};

async function ensureOutDir() {
  await mkdir(OUT_DIR, { recursive: true });
}

function svgBackground(width, height, variant = "default") {
  const extra =
    variant === "banner"
      ? `<ellipse cx="1200" cy="80" rx="420" ry="200" fill="url(#glowPurple)" opacity="0.35"/>`
      : `<ellipse cx="${width * 0.72}" cy="${height * 0.28}" rx="${width * 0.28}" ry="${height * 0.22}" fill="url(#glowPurple)" opacity="0.28"/>`;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#080810"/>
      <stop offset="55%" stop-color="#0a1020"/>
      <stop offset="100%" stop-color="#080810"/>
    </linearGradient>
    <radialGradient id="glowCyan" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#00d1ff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#00d1ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowPurple" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect width="100%" height="100%" fill="url(#glowCyan)"/>
  ${extra}
</svg>`;
}

async function renderThumbnail() {
  const size = 240;
  const iconSize = 168;
  const pad = Math.round((size - iconSize) / 2);

  const bg = Buffer.from(svgBackground(size, size));

  const icon = await sharp(ICON)
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const labelSvg = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <text x="120" y="222" text-anchor="middle"
      font-family="${BRAND.displayFont}" font-size="13" font-weight="700"
      letter-spacing="0.04em" fill="${BRAND.white}">Zorixa AI</text>
  </svg>`);

  const png = await sharp(bg)
    .composite([
      { input: icon, top: pad - 8, left: pad },
      { input: labelSvg, top: 0, left: 0 }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  ${svgBackground(240, 240).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}
  <image href="../zorixa-icon.png" x="36" y="28" width="168" height="168"/>
  <text x="120" y="222" text-anchor="middle" font-family="Space Grotesk" font-size="13" font-weight="700" letter-spacing="0.04em" fill="#ffffff">Zorixa AI</text>
</svg>`;

  await writeFile(path.join(OUT_DIR, "ph-thumbnail-240.svg"), svg);
  await writeFile(path.join(OUT_DIR, "ph-thumbnail-240.png"), png);
}

async function renderBanner() {
  const w = 1500;
  const h = 500;
  const panelW = 560;

  const screenshot = await sharp(SCREENSHOT)
    .resize(980, h, { fit: "cover", position: "right" })
    .png()
    .toBuffer();

  const fadeSvg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#080810" stop-opacity="1"/>
        <stop offset="42%" stop-color="#080810" stop-opacity="0.95"/>
        <stop offset="58%" stop-color="#080810" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#080810" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="${panelW - 80}" y="0" width="${w - panelW + 80}" height="${h}" fill="url(#fade)"/>
  </svg>`);

  const textSvg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${BRAND.cyan}"/>
        <stop offset="100%" stop-color="${BRAND.purple}"/>
      </linearGradient>
    </defs>
    <!-- Badge -->
    <rect x="64" y="56" rx="100" ry="100" width="248" height="34" fill="rgba(0,209,255,0.10)" stroke="rgba(0,209,255,0.35)" stroke-width="1"/>
    <circle cx="82" cy="73" r="4" fill="${BRAND.cyan}"/>
    <text x="96" y="78" font-family="${BRAND.bodyFont}" font-size="13" font-weight="600" fill="${BRAND.cyanSoft}">LIVE ON PRODUCT HUNT</text>

    <!-- Headline -->
    <text x="64" y="148" font-family="${BRAND.displayFont}" font-size="46" font-weight="700" fill="${BRAND.white}">Zorixa AI is here</text>
    <text x="64" y="198" font-family="${BRAND.displayFont}" font-size="46" font-weight="700" fill="url(#accent)">Multi-model AI video</text>

    <!-- Subhead -->
    <text x="64" y="248" font-family="${BRAND.bodyFont}" font-size="18" font-weight="500" fill="${BRAND.muted}">Kling 3.0 Pro · Google Veo 3.1 · Seedance 2.0 · Hailuo 2.3</text>
    <text x="64" y="276" font-family="${BRAND.bodyFont}" font-size="18" font-weight="500" fill="${BRAND.muted}">Flux · GPT Image 2 · Credits shown before you generate</text>

    <!-- Price line -->
    <text x="64" y="322" font-family="${BRAND.bodyFont}" font-size="16" font-weight="600" fill="${BRAND.white}">Plans from $9.99/mo · 1,000 credits</text>

    <!-- CTA pill -->
    <rect x="64" y="352" rx="12" ry="12" width="220" height="48" fill="${BRAND.cyan}"/>
    <text x="174" y="382" text-anchor="middle" font-family="${BRAND.displayFont}" font-size="16" font-weight="700" fill="#000000">Open Video Studio →</text>
  </svg>`);

  const bg = Buffer.from(svgBackground(w, h, "banner"));

  const png = await sharp(bg)
    .composite([
      { input: screenshot, top: 0, left: panelW - 40 },
      { input: fadeSvg, top: 0, left: 0 },
      { input: textSvg, top: 0, left: 0 }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(OUT_DIR, "ph-banner-1500x500.png"), png);
  await writeFile(path.join(OUT_DIR, "ph-banner-1500x500-text.svg"), textSvg);
}

async function renderOg() {
  const w = 1200;
  const h = 630;

  const screenshotBlur = await sharp(SCREENSHOT)
    .resize(w, h, { fit: "cover", position: "center" })
    .blur(8)
    .modulate({ brightness: 0.35, saturation: 0.8 })
    .png()
    .toBuffer();

  const overlay = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#080810" fill-opacity="0.72"/>
    ${svgBackground(w, h).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}
  </svg>`);

  const icon = await sharp(ICON).resize(72, 72, { fit: "contain" }).png().toBuffer();

  const textSvg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${BRAND.cyan}"/>
        <stop offset="100%" stop-color="${BRAND.purple}"/>
      </linearGradient>
    </defs>

    <!-- Logo wordmark -->
    <text x="156" y="118" font-family="${BRAND.displayFont}" font-size="42" font-weight="700" fill="${BRAND.white}">Zorixa AI</text>

    <!-- Headline -->
    <text x="80" y="210" font-family="${BRAND.displayFont}" font-size="52" font-weight="700" fill="${BRAND.white}">Multi-model AI video</text>
    <text x="80" y="272" font-family="${BRAND.displayFont}" font-size="52" font-weight="700" fill="url(#accent)">&amp; image studio</text>

    <!-- Subhead -->
    <text x="80" y="330" font-family="${BRAND.bodyFont}" font-size="22" font-weight="500" fill="${BRAND.muted}">Kling 3.0 Pro · Google Veo 3.1 · Seedance 2.0 · Hailuo 2.3 · Flux · GPT Image 2</text>

    <!-- Divider -->
    <rect x="80" y="368" width="1040" height="1" fill="rgba(255,255,255,0.10)"/>

    <!-- Footer lines -->
    <text x="80" y="418" font-family="${BRAND.bodyFont}" font-size="20" font-weight="600" fill="${BRAND.white}">Credits shown before every generation</text>
    <text x="80" y="452" font-family="${BRAND.bodyFont}" font-size="18" font-weight="500" fill="${BRAND.muted}">Plans from $9.99/mo · 1,000 credits · 30+ AI models</text>
    <text x="80" y="548" font-family="${BRAND.displayFont}" font-size="24" font-weight="700" fill="${BRAND.cyan}">zorixaai.com/video</text>
  </svg>`);

  const png = await sharp(screenshotBlur)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: icon, top: 72, left: 72 },
      { input: textSvg, top: 0, left: 0 }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(OUT_DIR, "ph-og-1200x630.png"), png);
  await writeFile(path.join(OUT_DIR, "ph-og-1200x630-text.svg"), textSvg);
}

async function writeLayoutSpec() {
  const spec = `# Zorixa AI — Product Hunt Launch Asset Specs

Export-ready layout specifications for Canva, Figma, or manual polish.
Generated assets live in \`public/product-hunt/\`.

---

## Brand tokens

| Token | Value | Use |
|-------|-------|-----|
| Background | \`#080810\` | Primary canvas |
| Elevated | \`#0d0d14\` | Panels, cards |
| Accent cyan | \`#00d1ff\` | CTA, links, highlights |
| Accent soft | \`#7ee9ff\` | Badge text |
| Accent purple | \`#8b5cf6\` | Gradient end, glow |
| Text primary | \`#ffffff\` | Headlines |
| Text muted | \`#a1a1aa\` | Subheads |
| Display font | **Space Grotesk** 700 | Headlines, wordmark |
| Body font | **DM Sans** 500–600 | Subheads, labels |

**Google Fonts import:**
\`\`\`
https://fonts.google.com/share?selection.family=DM+Sans:wght@500;600;700|Space+Grotesk:wght@600;700
\`\`\`

**Logo files:** \`public/zorixa-icon.png\` (512×512) · \`public/zorixa-z-letter.png\`

**Hero screenshot:** \`.tmp/ph-screenshots/01_video_model_picker.png\`

---

## 1. Product Hunt thumbnail — 240×240

**File:** \`ph-thumbnail-240.png\`

| Element | Position (px) | Size | Typography / asset |
|---------|---------------|------|---------------------|
| Canvas | 0, 0 | 240×240 | Fill \`#080810\` + cyan/purple radial glow |
| Logo | 36, 28 | 168×168 | \`zorixa-icon.png\`, contain |
| Wordmark | center x=120, y=222 | — | Space Grotesk **700**, 13px, 0.04em tracking, \`#ffffff\` |

**Canva:** Custom size 240×240 → center logo → optional text below.

**Figma frame:** \`PH / Thumbnail / 240\`

---

## 2. Launch banner — 1500×500

**File:** \`ph-banner-1500x500.png\`

### Layout grid
- **Left text panel:** x 0–560 (padding 64px)
- **Right visual:** x 520–1500 (screenshot crop, right-aligned)
- **Fade overlay:** x 480–640 gradient to blend text ↔ image

| Element | x | y | Style |
|---------|---|---|-------|
| Badge pill | 64 | 56 | 248×34, radius 100, fill \`#00d1ff\` 10%, stroke 35% |
| Badge dot | 82 | 73 | 8×8, \`#00d1ff\` |
| Badge label | 96 | 78 | DM Sans 600, 13px, \`#7ee9ff\`, "LIVE ON PRODUCT HUNT" |
| Headline L1 | 64 | 148 | Space Grotesk 700, **46px**, \`#fff\`, "Zorixa AI is here" |
| Headline L2 | 64 | 198 | Space Grotesk 700, **46px**, gradient cyan→purple, "Multi-model AI video" |
| Subhead L1 | 64 | 248 | DM Sans 500, 18px, \`#a1a1aa\`, models line 1 |
| Subhead L2 | 64 | 276 | DM Sans 500, 18px, \`#a1a1aa\`, models line 2 |
| Price | 64 | 322 | DM Sans 600, 16px, \`#fff\`, "Plans from $9.99/mo · 1,000 credits" |
| CTA button | 64 | 352 | 220×48, radius 12, fill \`#00d1ff\` |
| CTA label | 174 | 382 | Space Grotesk 700, 16px, \`#000\`, "Open Video Studio →" |

**Screenshot placement:** crop \`01_video_model_picker.png\` to 980×500, align right, object-fit cover.

**Figma frame:** \`PH / Banner / 1500×500\`

---

## 3. Open Graph image — 1200×630

**File:** \`ph-og-1200x630.png\`

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
| URL | 80 | 548 | Space Grotesk 700, 24px, \`#00d1ff\`, zorixaai.com/video |

**Figma frame:** \`PH / OG / 1200×630\`

---

## 4. Gallery upload order (1270×760)

Use screenshots from \`.tmp/ph-screenshots/\` — resize to **1270×760** if needed.

1. \`01_video_model_picker.png\`
2. \`06_model_picker.png\`
3. \`02_ai_director.png\`
4. \`03_image_to_video.png\`
5. \`04_reference_to_video.png\`
6. \`01_image_model_picker.png\`
7. \`07_pricing.png\`
8. \`05_audio_to_video.png\`

Copy + titles: see final gallery kit in chat / docs.

---

## 5. Canva quick setup

1. **Thumbnail:** Design → Custom size 240×240 → upload \`zorixa-icon.png\` → Effects → glow optional.
2. **Banner:** Custom 1500×500 → upload generated PNG as base OR rebuild with spec table.
3. **OG:** Custom 1200×630 → import \`ph-og-1200x630.png\` → tweak if needed.

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
`;

  await writeFile(path.join(OUT_DIR, "LAYOUT-SPEC.md"), spec);
}

async function main() {
  await ensureOutDir();
  await renderThumbnail();
  await renderBanner();
  await renderOg();
  await writeLayoutSpec();
  console.log("Product Hunt assets written to:", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
