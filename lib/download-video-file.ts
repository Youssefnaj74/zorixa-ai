import { humanizeClientFetchError } from "@/lib/upload-client-media";
import { buildVideoDownloadUrl } from "@/lib/video-playback-proxy";

export function videoDownloadFilename(url?: string, title?: string): string {
  const slug =
    title
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "";
  if (slug) return `${slug}.mp4`;

  const raw = url?.trim() ?? "";
  if (raw) {
    try {
      const path = new URL(raw, "https://placeholder.local").pathname;
      const base = path.split("/").pop()?.split("?")[0] ?? "";
      if (/\.(mp4|webm|mov)$/i.test(base)) return base;
    } catch {
      /* ignore */
    }
  }

  return `zorixa-video-${Date.now()}.mp4`;
}

function triggerBlobDownload(blob: Blob, saveAs: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = saveAs;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Downloads via same-origin `/api/video-download` (server streams from OSS).
 * Uses fetch → blob (same pattern as image download) so mobile Safari and
 * Chromium actually save the file; a bare `<a download>` to the API is unreliable.
 * Same-origin showcase paths (`/video-showcases/...`) download directly.
 */
export async function downloadVideoFile(
  canonicalHttpsUrl: string,
  filename?: string
): Promise<void> {
  const saveAs = filename?.trim() || videoDownloadFilename(canonicalHttpsUrl);
  const canonical = canonicalHttpsUrl.trim();

  if (typeof window === "undefined") {
    throw new Error("Download is only available in the browser");
  }

  let fetchUrl: string;
  if (canonical.startsWith("https://")) {
    const apiUrl = buildVideoDownloadUrl(canonical, window.location.origin);
    if (!apiUrl.includes("/api/video-download")) {
      throw new Error("This video host cannot be downloaded through Zorixa.");
    }
    fetchUrl = apiUrl;
  } else if (canonical.startsWith("/") && !canonical.startsWith("//")) {
    fetchUrl = canonical;
  } else if (canonical.startsWith("blob:")) {
    fetchUrl = canonical;
  } else {
    throw new Error("Invalid video URL");
  }

  let res: Response;
  try {
    res = await fetch(fetchUrl, { credentials: "include", cache: "no-store" });
  } catch (e) {
    throw new Error(humanizeClientFetchError(e));
  }

  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* not JSON */
    }
    if (res.status === 401) {
      message = "Sign in to download videos.";
    }
    throw new Error(message);
  }

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  if (
    contentType.includes("xml") ||
    contentType.includes("application/json") ||
    contentType.includes("text/html")
  ) {
    throw new Error(
      contentType.includes("text/html")
        ? "Download returned an error page instead of the video. Refresh and try again while signed in."
        : "Video host blocked the download. Sign in on Zorixa and try again."
    );
  }

  const blob = await res.blob();
  if (blob.size < 2048) {
    throw new Error("Downloaded file is too small — the video may have expired.");
  }

  triggerBlobDownload(blob, saveAs);
}
