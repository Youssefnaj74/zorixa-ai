import sharp from "sharp";

import { isHailuo23I2vImageMagic } from "@/lib/atlas-hailuo-video";
import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SHOWCASE_PUBLIC_ORIGIN = "https://www.zorixaai.com";
/** MiniMax Hailuo I2V: short side must be greater than 300px. */
const HAILUO_MIN_SHORT_SIDE_PX = 301;
/** Upscale small inputs to this short side so Atlas accepts them. */
const HAILUO_UPSCALE_SHORT_SIDE_PX = 512;

function contentTypeForHailuoBytes(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
  return "application/octet-stream";
}

function extensionForHailuoBytes(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "webp";
  return "bin";
}

/** Showcase assets under /video-showcases/ — prefer production origin for Atlas fetch. */
export function normalizeShowcaseImageUrlForAtlas(raw: string): string {
  const coerced = coerceToPublicHttpsUrl(raw.trim());
  if (!coerced) return raw.trim();
  try {
    const u = new URL(coerced);
    if (
      u.pathname.startsWith("/video-showcases/") ||
      u.pathname.startsWith("/image-showcases/")
    ) {
      return `${SHOWCASE_PUBLIC_ORIGIN}${u.pathname}${u.search}`;
    }
  } catch {
    /* keep coerced */
  }
  return coerced;
}

async function uploadHailuoImageBytes(
  userId: string,
  bytes: Uint8Array
): Promise<string | null> {
  const ext = extensionForHailuoBytes(bytes);
  const contentType = contentTypeForHailuoBytes(bytes);
  const path = `${userId}/hailuo-i2v/${crypto.randomUUID()}.${ext}`;
  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(path, bytes, {
    contentType,
    upsert: false
  });
  if (uploadErr) {
    console.warn("[hailuo-i2v] upload failed", uploadErr.message);
    return null;
  }
  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  return coerceToPublicHttpsUrl(data.publicUrl);
}

/**
 * Validate Hailuo I2V start frame is fetchable + supported format.
 * Upscales images whose short side is ≤300px (Atlas returns "invalid parameters").
 * Rewrites studio showcase paths to www.zorixaai.com (Atlas-reachable, full resolution).
 */
export async function prepareHailuo23I2vImageUrl(input: {
  imageUrl: string;
  userId: string;
}): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  const normalized = normalizeShowcaseImageUrlForAtlas(input.imageUrl);
  const publicUrl = coerceToPublicHttpsUrl(normalized);
  if (!publicUrl) {
    return {
      ok: false,
      error:
        "Start frame must be a public https:// URL so Atlas can fetch it. Re-upload the image and try again."
    };
  }

  let upstream: Response;
  try {
    upstream = await fetch(publicUrl, {
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "image/*,*/*" }
    });
  } catch {
    return {
      ok: false,
      error:
        "Could not download the start frame image. Re-upload a JPG or PNG and try again."
    };
  }

  if (!upstream.ok) {
    return {
      ok: false,
      error: `Start frame URL returned ${upstream.status}. Re-upload a JPG or PNG (Hailuo rejects missing/expired image links).`
    };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await upstream.arrayBuffer());
  } catch {
    return {
      ok: false,
      error: "Could not read the start frame image. Re-upload a JPG or PNG and try again."
    };
  }

  if (!isHailuo23I2vImageMagic(bytes)) {
    return {
      ok: false,
      error:
        "Hailuo 2.3 Image to Video requires a JPG, PNG, or WebP start frame (AVIF and other formats are rejected)."
    };
  }

  if (bytes.byteLength > 20 * 1024 * 1024) {
    return {
      ok: false,
      error: "Start frame must be under 20MB for Hailuo 2.3."
    };
  }

  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(bytes).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  } catch {
    return {
      ok: false,
      error: "Could not read start frame dimensions. Re-upload a JPG or PNG and try again."
    };
  }

  if (width < 1 || height < 1) {
    return {
      ok: false,
      error: "Start frame image is empty or unreadable. Re-upload a JPG or PNG."
    };
  }

  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const aspect = longSide / shortSide;
  if (aspect >= 2.5) {
    return {
      ok: false,
      error:
        "Hailuo 2.3 requires image aspect ratio between 2:5 and 5:2. Use a less extreme crop."
    };
  }

  let pathname = "";
  try {
    pathname = new URL(publicUrl).pathname;
  } catch {
    pathname = "";
  }
  const isShowcase =
    pathname.startsWith("/video-showcases/") || pathname.startsWith("/image-showcases/");

  // Full-size showcase on zorixaai.com is already Atlas-safe — no re-host needed.
  if (isShowcase && shortSide >= HAILUO_MIN_SHORT_SIDE_PX) {
    return { ok: true, imageUrl: publicUrl };
  }

  if (shortSide < HAILUO_MIN_SHORT_SIDE_PX) {
    const scale = HAILUO_UPSCALE_SHORT_SIDE_PX / shortSide;
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));
    try {
      bytes = new Uint8Array(
        await sharp(bytes)
          .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
          .png()
          .toBuffer()
      );
    } catch (e) {
      console.warn("[hailuo-i2v] upscale failed", e);
      return {
        ok: false,
        error: `Hailuo needs a larger start frame (short side > 300px). Yours is ${width}×${height}. Upload a higher-resolution JPG/PNG.`
      };
    }

    const hosted = await uploadHailuoImageBytes(input.userId, bytes);
    if (!hosted) {
      return {
        ok: false,
        error: `Hailuo needs a larger start frame (short side > 300px). Yours is ${width}×${height}. Upload a higher-resolution JPG/PNG.`
      };
    }
    console.log("[hailuo-i2v] upscaled start frame", {
      from: `${width}x${height}`,
      to: `${outW}x${outH}`,
      host: new URL(hosted).host
    });
    return { ok: true, imageUrl: hosted };
  }

  return { ok: true, imageUrl: publicUrl };
}
