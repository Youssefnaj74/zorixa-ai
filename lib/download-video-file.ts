import { buildVideoDownloadUrl } from "@/lib/video-playback-proxy";

/**
 * Downloads via same-origin `/api/video-download` (server streams from OSS).
 * Uses `fetch` + Blob so the browser never navigates to Aliyun URLs (referer policy).
 */
export async function downloadVideoFile(
  canonicalHttpsUrl: string,
  filename = "zorixa-video.mp4"
): Promise<void> {
  const canonical = canonicalHttpsUrl.trim();
  if (!canonical.startsWith("https://")) {
    throw new Error("Invalid video URL");
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
      "Video host blocked the download. Sign in on Zorixa and try again, or wait for the latest site update."
    );
  }

  const blob = await res.blob();
  if (blob.size < 2048) {
    throw new Error("Downloaded file is too small — the video may have expired or been blocked.");
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
