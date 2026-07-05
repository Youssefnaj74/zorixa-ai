import { buildAudioDownloadUrl } from "@/lib/audio-playback-proxy";

export function audioDownloadFilename(url?: string, title?: string): string {
  const slug =
    title
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "";
  if (slug) return `${slug}.mp3`;

  const raw = url?.trim() ?? "";
  if (raw) {
    try {
      const path = new URL(raw).pathname;
      const base = path.split("/").pop()?.split("?")[0] ?? "";
      if (/\.(mp3|mpeg|wav|m4a)$/i.test(base)) return base;
    } catch {
      /* ignore */
    }
  }

  return `zorixa-speech-${Date.now()}.mp3`;
}

/** Downloads via same-origin `/api/audio-download` (server streams from Supabase). */
export async function downloadAudioFile(
  canonicalHttpsUrl: string,
  filename?: string
): Promise<void> {
  const saveAs = filename?.trim() || audioDownloadFilename(canonicalHttpsUrl);
  const canonical = canonicalHttpsUrl.trim();
  if (!canonical.startsWith("https://")) {
    throw new Error("Invalid audio URL");
  }

  if (typeof window === "undefined") {
    throw new Error("Download is only available in the browser");
  }

  const apiUrl = buildAudioDownloadUrl(canonical, window.location.origin);
  if (!apiUrl.includes("/api/audio-download")) {
    throw new Error("This audio host cannot be downloaded through Zorixa.");
  }

  const fetchUrl = `${apiUrl}&mode=buffer`;
  const res = await fetch(fetchUrl, { credentials: "include", cache: "no-store" });

  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* not JSON */
    }
    if (res.status === 401) {
      message = "Sign in to download speech from Zorixa.";
    }
    throw new Error(message);
  }

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("xml") || contentType.includes("text/html")) {
    throw new Error("Audio download was blocked. Sign in on Zorixa and try again.");
  }

  const blob = await res.blob();
  if (blob.size < 256) {
    throw new Error("Downloaded file is too small — generate speech again.");
  }

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
