import { buildVideoDownloadUrl } from "@/lib/video-playback-proxy";

/** Derive a safe filename from URL path or fall back to PNG. */
export function imageDownloadFilename(url: string, title?: string): string {
  const slug =
    (title ?? "zorixa-image")
      .trim()
      .toLowerCase()
      .replace(/[^\w\-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 48) || "zorixa-image";

  try {
    const path = new URL(url).pathname;
    const match = path.match(/\.(png|jpe?g|webp|gif|avif)$/i);
    if (match) return `${slug}.${match[1].toLowerCase()}`;
  } catch {
    /* ignore */
  }
  return `${slug}.png`;
}

/**
 * Downloads via same-origin `/api/video-download` (server streams from OSS/CDN).
 * Reuses the authenticated media proxy — works for Atlas image URLs too.
 */
export async function downloadImageFile(
  canonicalHttpsUrl: string,
  filename = "zorixa-image.png"
): Promise<void> {
  const canonical = canonicalHttpsUrl.trim();
  if (!canonical.startsWith("https://")) {
    throw new Error("Invalid image URL");
  }

  if (typeof window === "undefined") {
    throw new Error("Download is only available in the browser");
  }

  const apiUrl = buildVideoDownloadUrl(canonical, window.location.origin);
  const res = await fetch(apiUrl, { credentials: "include", cache: "no-store" });

  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("xml") || contentType.includes("text/html")) {
    throw new Error(
      "Image host blocked the download. Sign in on Zorixa and try again."
    );
  }

  const blob = await res.blob();
  if (blob.size < 512) {
    throw new Error("Downloaded file is too small — the image may have expired.");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
