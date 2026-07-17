/**
 * Official model brand logos — assets in /public/models/.
 * Re-sync: `node scripts/sync-model-logos.mjs`
 */

/** Official download source per asset (for audits / re-sync). */
export const MODEL_LOGO_SOURCES: Record<string, string> = {
  "openai-icon.svg":
    "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  "google-g.svg":
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  "gemini.svg":
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg",
  "veo.svg": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  "grok.svg":
    "https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/icons/grok.svg",
  "seedance.png": "ByteDance Seedance 2.0 product mark (official model-header reference)",
  "wan.ico": "https://wan.video/favicon.ico",
  "alibaba.ico": "https://www.alibaba.com/favicon.ico",
  "happyhorse.ico": "https://www.alibaba.com/favicon.ico",
  "hailuo.ico": "https://www.minimaxi.com/favicon.ico",
  "vidu.svg": "https://www.vidu.com/logo.svg",
  "flux.ico": "https://bfl.ai/favicon.ico",
  "qwen.ico": "https://www.alibaba.com/favicon.ico"
};

const G = {
  openai: "/models/openai-icon.svg",
  google: "/models/google-g.svg",
  gemini: "/models/gemini.svg",
  veo: "/models/veo.svg",
  grok: "/models/grok.svg",
  kling: "/models/kling.ico",
  seedance: "/models/seedance.png",
  wan: "/models/wan.ico",
  alibaba: "/models/alibaba.ico",
  happyhorse: "/models/happyhorse.ico",
  hailuo: "/models/hailuo.ico",
  vidu: "/models/vidu.svg",
  flux: "/models/flux.ico",
  qwen: "/models/qwen.ico",
  zorixa: "/models/gemini.svg"
} as const;

/** Explicit composer id → logo path (sidebar + bottom bars). */
export const MODEL_LOGOS: Record<string, string> = {
  "gpt-image-2": G.openai,
  "nano-banana-2": G.gemini,
  "nano-banana-pro": G.gemini,
  zorixa: G.qwen,
  "seedream-5": G.seedance,
  "seedream-5-pro": G.seedance,
  "grok-imagine": G.grok,
  "flux-dev": G.flux,
  "flux-schnell": G.flux,
  "flux-dev-lora": G.flux,
  "flux-kontext-dev": G.flux,
  "flux-kontext-dev-lora": G.flux,
  "wan-image-2-7": G.wan,
  "wan-image-2-7-pro": G.wan,
  "wan-image-2-6": G.wan,

  "grok-imagine-video-t2v": G.grok,
  "grok-imagine-video-i2v-15": G.grok,
  "grok-imagine-video-r2v": G.grok,

  "gemini-omni-flash-t2v": G.gemini,
  "gemini-omni-flash-i2v": G.gemini,
  "gemini-omni-flash-r2v": G.gemini,

  "kling-3-pro": G.kling,
  "kling-2-6-motion": G.kling,

  "seedance-2": G.seedance,
  "seedance-1-5": G.seedance,
  "seedance-1-5-pro": G.seedance,

  "wan-2-6": G.wan,
  "wan-2-7": G.wan,
  "wan-2-2-character-swap": G.wan,

  "happyhorse-1": G.happyhorse,

  "hailuo-2-3": G.hailuo,

  "google-veo-3-1": G.veo,

  "vidu-q3": G.vidu,
  "vidu-q3-pro": G.vidu,

  infinitetalk: G.alibaba,
  "veed-fabric-1": G.google,
  "veed-fabric-1-fast": G.google,
  "omni-human-1-5": G.seedance,
  "atlas-video-upscaler": G.zorixa
};

export const MODEL_LOGO_DEFAULT_SIZE = 20;

export function resolveModelLogoPath(composerId: string | null | undefined): string | null {
  const id = composerId?.toLowerCase().trim();
  if (!id) return null;

  const exact = MODEL_LOGOS[id];
  if (exact) return exact;

  if (id.includes("gpt-image") || id.includes("openai")) return G.openai;
  if (id.includes("nano-banana") || id.includes("gemini")) return G.gemini;
  if (id.includes("google-veo") || id.includes("veo-3")) return G.veo;
  if (id.includes("grok")) return G.grok;
  if (id.includes("kling")) return G.kling;
  if (id.includes("seedream") || id.includes("seedance") || id.includes("omni-human"))
    return G.seedance;
  if (id.includes("flux")) return G.flux;
  if (id.includes("wan")) return G.wan;
  if (id.includes("happyhorse")) return G.happyhorse;
  if (id.includes("hailuo")) return G.hailuo;
  if (id.includes("vidu")) return G.vidu;
  if (id === "zorixa" || id.includes("qwen")) return G.qwen;
  if (id.includes("veed") || id.includes("fabric")) return G.google;
  if (id.includes("infinitetalk")) return G.alibaba;
  if (id.includes("upscaler")) return G.zorixa;

  return null;
}

/** Dark UI: keep brand colors; only dim very bright marks slightly. */
export function modelLogoImgClassName(path: string): string {
  if (path.endsWith(".svg") && path.includes("google-g")) {
    return "brightness-110 contrast-110";
  }
  return "";
}
