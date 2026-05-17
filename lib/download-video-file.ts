import { buildVideoDownloadUrl } from "@/lib/video-playback-proxy";

/**
 * Starts download via same-origin `/api/video-download` → 302 to Atlas CDN.
 * No `fetch` (avoids CORS on redirect); the browser follows the redirect natively.
 */
export function downloadVideoFile(
  canonicalHttpsUrl: string,
  filename = "zorixa-video.mp4"
): void {
  const canonical = canonicalHttpsUrl.trim();
  if (!canonical.startsWith("https://")) {
    throw new Error("Invalid video URL");
  }

  if (typeof window === "undefined") {
    throw new Error("Download is only available in the browser");
  }

  const a = document.createElement("a");
  a.href = buildVideoDownloadUrl(canonical, window.location.origin);
  a.download = filename;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
