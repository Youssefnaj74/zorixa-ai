import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1/model";
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "tool-previews");

const MODELS = [
  ["gpt-image-2", "openai/gpt-image-2/text-to-image"],
  ["nano-banana-2", "google/nano-banana-2/text-to-image"],
  ["nano-banana-pro", "google/nano-banana-pro/text-to-image"],
  ["zorixa", "qwen/qwen-image-2.0-pro/text-to-image"],
  ["seedream-5", "bytedance/seedream-v5.0-lite"],
  ["grok-imagine", "xai/grok-imagine-image-quality/text-to-image"],
  ["flux-dev", "black-forest-labs/flux-dev"],
  ["flux-schnell", "black-forest-labs/flux-schnell"],
  ["flux-dev-lora", "black-forest-labs/flux-dev-lora"],
  ["flux-kontext-dev", "black-forest-labs/flux-kontext-dev"],
  ["flux-kontext-dev-lora", "black-forest-labs/flux-kontext-dev-lora"],
  ["wan-image-2-7", "alibaba/wan-2.7/text-to-image"],
  ["wan-image-2-7-pro", "alibaba/wan-2.7-pro/text-to-image"],
  ["wan-image-2-6", "alibaba/wan-2.6/text-to-image"]
];

const IMAGE_TO_IMAGE_MODELS = [
  ["gpt-image-2", "openai/gpt-image-2/text-to-image"],
  ["nano-banana-2", "google/nano-banana-2/text-to-image"],
  ["nano-banana-pro", "google/nano-banana-pro/text-to-image"],
  ["zorixa", "qwen/qwen-image-2.0-pro/text-to-image"],
  ["seedream-5", "bytedance/seedream-v5.0-lite"],
  ["grok-imagine", "xai/grok-imagine-image-quality/text-to-image"],
  ["flux-kontext-dev", "black-forest-labs/flux-kontext-dev"],
  ["flux-kontext-dev-lora", "black-forest-labs/flux-kontext-dev-lora"],
  ["wan-image-2-7", "alibaba/wan-2.7/text-to-image"],
  ["wan-image-2-7-pro", "alibaba/wan-2.7-pro/text-to-image"],
  ["wan-image-2-6", "alibaba/wan-2.6/text-to-image"]
];

const VIDEO_TOOL_MODELS = [
  ["kling-3-pro", "Kling 3.0 Pro"],
  ["kling-2-6-motion", "Kling 2.6 Motion"],
  ["seedance-2", "Seedance 2.0"],
  ["seedance-1-5", "Seedance 1.5 Pro"],
  ["wan-2-6", "Wan 2.6"],
  ["wan-2-2-character-swap", "Wan 2.2 Character Swap"],
  ["happyhorse-1", "HappyHorse 1.0"],
  ["wan-2-7", "Wan 2.7"],
  ["hailuo-2-3", "Hailuo 2.3"],
  ["google-veo-3-1", "Google Veo 3.1"],
  ["vidu-q3", "Vidu Q3"],
  ["vidu-q3-pro", "Vidu Q3-Pro"]
];

const REMAINING_VIDEO_TOOL_SECTIONS = {
  "reference-to-video": [
    ["seedance-2", "Seedance 2.0"],
    ["vidu-q3", "Vidu Q3"],
    ["happyhorse-1", "HappyHorse 1.0"],
    ["wan-2-7", "Wan 2.7"],
    ["google-veo-3-1", "Google Veo 3.1"]
  ],
  "video-to-video": [
    ["wan-2-6", "Wan 2.6"],
    ["wan-2-7", "Wan 2.7"],
    ["happyhorse-1", "HappyHorse 1.0"],
    ["vidu-q3-pro", "Vidu Q3-Pro"]
  ],
  "character-swap": [
    ["kling-2-6-motion", "Kling 2.6 Motion"],
    ["wan-2-2-character-swap", "Wan 2.2 Character Swap"]
  ],
  "audio-to-video": [
    ["infinitetalk", "InfiniteTalk"],
    ["veed-fabric-1", "VEED Fabric 1.0"],
    ["veed-fabric-1-fast", "VEED Fabric 1.0 Fast"]
  ]
};

function loadDotenv(contents) {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

async function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    try {
      loadDotenv(await readFile(path.join(ROOT, file), "utf8"));
    } catch {
      // optional
    }
  }
}

function promptFor(id, section, label = id) {
  if (section === "text-to-video") {
    return [
      `Premium Zorixa AI text-to-video preview for ${label}.`,
      "A cinematic scene born from a text prompt: dynamic camera path, dramatic light beams, storyboard frames floating in a dark creative studio, violet and cyan energy, high-end motion design, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail with a clear film-like subject and dark negative space."
    ].join(" ");
  }
  if (section === "image-to-video") {
    return [
      `Premium Zorixa AI image-to-video preview for ${label}.`,
      "A still image transforming into motion: photo frame, motion trails, animated particles, cinematic depth, glass timeline UI, violet and cyan studio lighting, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail, visually different from text-to-video, with clear image-to-motion energy."
    ].join(" ");
  }
  if (section === "reference-to-video") {
    return [
      `Premium Zorixa AI reference-to-video preview for ${label}.`,
      "Multiple reference frames guiding one cinematic video: character sheet, product reference, arrows of motion, luminous timeline panels, violet and cyan studio light, premium AI motion design, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail with clear reference-driven video energy."
    ].join(" ");
  }
  if (section === "video-to-video") {
    return [
      `Premium Zorixa AI video-to-video preview for ${label}.`,
      "A video clip being transformed into a stylized cinematic version: filmstrip frames, before-after motion trail, glowing editing layers, dark studio, violet and cyan accents, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail, distinct from text-to-video and image-to-video."
    ].join(" ");
  }
  if (section === "character-swap") {
    return [
      `Premium Zorixa AI character swap preview for ${label}.`,
      "Two character silhouettes swapping identity across cinematic frames: face/character consistency grid, neon motion path, high-end VFX interface, violet and cyan lighting, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail with clear character replacement concept."
    ].join(" ");
  }
  if (section === "audio-to-video") {
    return [
      `Premium Zorixa AI audio-to-video preview for ${label}.`,
      "A portrait reacting to sound waves: microphone waveform, lip sync timeline, cinematic avatar frame, glowing audio particles, dark violet and cyan AI studio, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail with clear audio-driven video concept."
    ].join(" ");
  }
  if (section === "image-to-image") {
    return [
      `Premium Zorixa AI image-to-image preview for ${id}.`,
      "A cinematic before-and-after creative edit concept: one reference image transforms into a polished final image, split by subtle glass panels, violet and cyan light, premium AI studio interface, crisp detail, no text, no logo, no watermark.",
      "Composition designed as a 16:10 app card thumbnail with clear transformation energy and dark negative space."
    ].join(" ");
  }
  return [
    `Premium Zorixa AI text-to-image preview for ${id}.`,
    "A cinematic futuristic creative studio scene generated from a prompt, glass UI panels, violet and cyan light, high-end product photography, crisp detail, no text, no logo, no watermark.",
    "Composition designed as a 16:10 app card thumbnail with a clear central subject and dark negative space."
  ].join(" ");
}

function buildBody(modelId, atlasModel, section, label) {
  const prompt = promptFor(modelId, section, label);
  if (modelId === "gpt-image-2") {
    return {
      model: atlasModel,
      prompt,
      size: "1536x1024",
      quality: "low"
    };
  }
  if (modelId === "seedream-5") {
    return {
      model: atlasModel,
      prompt,
      size: "2048*2048"
    };
  }
  return {
    model: atlasModel,
    prompt,
    width: 1536,
    height: 1024
  };
}

function firstUrl(value) {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = firstUrl(item);
      if (found) return found;
    }
  }
  return null;
}

async function generate(apiKey, modelId, atlasModel, section, label) {
  const createRes = await fetch(`${ATLAS_BASE}/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildBody(modelId, atlasModel, section, label))
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createJson.message || createJson.error || `Atlas failed (${createRes.status})`);
  }

  const predictionId = createJson?.data?.id;
  if (!predictionId) throw new Error("Atlas did not return prediction id");

  for (let i = 0; i < 90; i++) {
    const pollRes = await fetch(`${ATLAS_BASE}/prediction/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const pollJson = await pollRes.json();
    if (!pollRes.ok) {
      throw new Error(pollJson.message || `Poll failed (${pollRes.status})`);
    }

    const status = String(pollJson?.data?.status || "").toLowerCase();
    const outputUrl = firstUrl(pollJson?.data?.outputs) || firstUrl(pollJson?.data?.output);
    if (outputUrl && ["completed", "succeeded", "success"].includes(status)) {
      return outputUrl;
    }
    if (status === "failed") {
      throw new Error(pollJson?.data?.error || pollJson.message || "Prediction failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Timed out waiting for Atlas output");
}

async function downloadImage(url, targetPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(targetPath, bytes);
}

await loadEnvFiles();
const apiKey = process.env.ATLASCLOUD_API_KEY?.trim();
if (!apiKey) {
  throw new Error("Missing ATLASCLOUD_API_KEY in .env.local");
}

await mkdir(OUT_DIR, { recursive: true });

const mode = process.argv.includes("--image-to-image-only")
  ? "image-to-image"
  : process.argv.includes("--remaining-video-tools-only")
    ? "remaining-video-tools"
  : process.argv.includes("--video-tools-only")
    ? "video-tools"
    : "text-to-image";
const targets =
  mode === "image-to-image" ? IMAGE_TO_IMAGE_MODELS : mode === "video-tools" ? VIDEO_TOOL_MODELS : MODELS;
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

if (mode === "remaining-video-tools") {
  for (const [section, models] of Object.entries(REMAINING_VIDEO_TOOL_SECTIONS)) {
    for (const [modelId, label] of models) {
      const filename = `${section}-${modelId}.png`;
      if (onlyArg && onlyArg !== filename && onlyArg !== modelId) continue;
      const target = path.join(OUT_DIR, filename);
      console.log(`[tool-previews] generating ${filename}`);
      try {
        const url = await generate(apiKey, modelId, "openai/gpt-image-2/text-to-image", section, label);
        await downloadImage(url, target);
        console.log(`[tool-previews] saved public/tool-previews/${filename}`);
      } catch (error) {
        console.error(`[tool-previews] failed ${filename}: ${error?.message || error}`);
      }
    }
  }
} else if (mode === "video-tools") {
  for (const [modelId, label] of targets) {
    for (const section of ["text-to-video", "image-to-video"]) {
      const filename = `${section}-${modelId}.png`;
      const target = path.join(OUT_DIR, filename);
      console.log(`[tool-previews] generating ${filename}`);
      try {
        const url = await generate(apiKey, modelId, "openai/gpt-image-2/text-to-image", section, label);
        await downloadImage(url, target);
        console.log(`[tool-previews] saved public/tool-previews/${filename}`);
      } catch (error) {
        console.error(`[tool-previews] failed ${filename}: ${error?.message || error}`);
      }
    }
  }
} else {
  for (const [modelId, atlasModel] of targets) {
    const filename = mode === "image-to-image" ? `image-to-image-${modelId}.png` : `${modelId}.png`;
    const target = path.join(OUT_DIR, filename);
    console.log(`[tool-previews] generating ${filename}`);
    try {
      const url = await generate(apiKey, modelId, atlasModel, mode, modelId);
      await downloadImage(url, target);
      console.log(`[tool-previews] saved public/tool-previews/${filename}`);
    } catch (error) {
      console.error(`[tool-previews] failed ${filename}: ${error?.message || error}`);
    }
  }
}
