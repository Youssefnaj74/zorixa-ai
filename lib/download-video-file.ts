import { buildVideoDownloadUrl } from "@/lib/video-playback-proxy";

function saveBlobDownload(blob: Blob, filename: string): void {
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

/**
 * Download via `/api/video-download` (auth + allowlist), then CDN redirect.
 * Falls back to server proxy buffer if redirect cannot be used.
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

  const redirectApiUrl = buildVideoDownloadUrl(canonical, window.location.origin);

  const redirectRes = await fetch(redirectApiUrl, {
    credentials: "include",
    cache: "no-store",
    redirect: "manual"
  });

  if (redirectRes.status === 302 || redirectRes.status === 307) {
    const cdnUrl = redirectRes.headers.get("Location")?.trim();
    if (cdnUrl?.startsWith("https://")) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = cdnUrl;
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);
      window.setTimeout(() => iframe.remove(), 120_000);
      return;
    }
  }

  const proxyUrl = `${redirectApiUrl}&mode=proxy`;
  const proxyRes = await fetch(proxyUrl, { credentials: "include", cache: "no-store" });
  if (!proxyRes.ok) {
    throw new Error(`Download failed (${proxyRes.status})`);
  }

  const bytes = await proxyRes.arrayBuffer();
  if (bytes.byteLength < 2048) {
    throw new Error("Downloaded file is too small — try again or open the CDN link.");
  }

  const blob = new Blob([bytes], { type: proxyRes.headers.get("content-type") ?? "video/mp4" });
  saveBlobDownload(blob, filename);
}
