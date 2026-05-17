import { buildVideoDownloadUrl } from "@/lib/video-playback-proxy";

/**
 * Downloads the full MP4 via `/api/video-download` (authenticated, no Range).
 */
export async function downloadVideoFile(
  canonicalHttpsUrl: string,
  filename = "zorixa-video.mp4"
): Promise<void> {
  const canonical = canonicalHttpsUrl.trim();
  if (!canonical.startsWith("https://")) {
    throw new Error("Invalid video URL");
  }

  const fetchUrl =
    typeof window !== "undefined"
      ? buildVideoDownloadUrl(canonical, window.location.origin)
      : canonical;

  const res = await fetch(fetchUrl, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const bytes = await res.arrayBuffer();
  if (bytes.byteLength < 2048) {
    throw new Error("Downloaded file is too small — try again or open the CDN link.");
  }

  const blob = new Blob([bytes], { type: res.headers.get("content-type") ?? "video/mp4" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
