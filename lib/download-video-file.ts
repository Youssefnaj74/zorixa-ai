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
      const path = new URL(raw).pathname;
      const base = path.split("/").pop()?.split("?")[0] ?? "";
      if (/\.(mp4|webm|mov)$/i.test(base)) return base;
    } catch {
      /* ignore */
    }
  }

  return `zorixa-video-${Date.now()}.mp4`;
}

/**
 * Downloads via same-origin `/api/video-download` (server streams from OSS).
 * Never navigates the browser to Aliyun URLs (referer policy).
 */
export async function downloadVideoFile(
  canonicalHttpsUrl: string,
  filename?: string
): Promise<void> {
  const saveAs = filename?.trim() || videoDownloadFilename(canonicalHttpsUrl);
  const canonical = canonicalHttpsUrl.trim();
  if (!canonical.startsWith("https://")) {
    throw new Error("Invalid video URL");
  }

  if (typeof window === "undefined") {
    throw new Error("Download is only available in the browser");
  }

  const apiUrl = buildVideoDownloadUrl(canonical, window.location.origin);
  if (!apiUrl.includes("/api/video-download")) {
    throw new Error("This video host cannot be downloaded through Zorixa.");
  }

  try {
    const a = document.createElement("a");
    a.href = apiUrl;
    a.download = saveAs;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    throw new Error(humanizeClientFetchError(e));
  }
}
