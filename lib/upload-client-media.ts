import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";

function extensionForUploadedBlob(blob: Blob): string {
  const mt = (blob.type || "").toLowerCase();
  if (mt.includes("jpeg") || mt === "image/jpg") return "jpg";
  if (mt === "image/png") return "png";
  if (mt === "image/webp") return "webp";
  if (mt === "image/gif") return "gif";
  if (mt.startsWith("audio/")) return "mp3";
  if (mt.startsWith("video/")) return "mp4";
  return "png";
}

/** Atlas must fetch the URL from the public internet (not localhost / LAN). */
export function atlasCanFetchUrlDirectly(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) {
      return false;
    }
    if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
      return false;
    }
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function humanizeClientFetchError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "Failed to fetch" || /networkerror/i.test(msg)) {
    return "Network error — stay signed in, keep this tab open, and make sure the site (or `npm run dev` on localhost) is still running.";
  }
  if (msg.includes("Upload failed") || msg.includes("Unauthorized")) {
    return msg;
  }
  return msg || "Upload failed. Try again.";
}

export async function uploadFileToPublicStorage(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  let up: Response;
  try {
    up = await fetch("/api/upload", {
      method: "POST",
      body: form,
      credentials: "include"
    });
  } catch (e) {
    throw new Error(humanizeClientFetchError(e));
  }
  if (!up.ok) {
    let message = "Upload failed — sign in and try again.";
    try {
      const j = (await up.json()) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const data = (await up.json()) as { url: string };
  const out = coerceToPublicHttpsUrl(data.url);
  if (!out) {
    throw new Error("Upload did not return a usable https URL.");
  }
  return out;
}

export async function uploadBlobUrlToPublicStorage(blobUrl: string): Promise<string> {
  let blobRes: Response;
  try {
    blobRes = await fetch(blobUrl);
  } catch (e) {
    throw new Error(
      "Could not read the uploaded file (link expired). Remove the image and upload it again."
    );
  }
  if (!blobRes.ok) {
    throw new Error(
      "Could not read the uploaded file (link expired). Remove the image and upload it again."
    );
  }
  const blob = await blobRes.blob();
  const ext = extensionForUploadedBlob(blob);
  const file = new File([blob], `upload.${ext}`, {
    type: blob.type || "application/octet-stream"
  });
  return uploadFileToPublicStorage(file);
}

/** In-memory map: blob preview URL → original File (survives blob revoke races). */
const clientBlobFiles = new Map<string, File>();

export function registerClientMediaBlob(blobUrl: string, file: File): void {
  clientBlobFiles.set(blobUrl, file);
}

export function clearClientMediaBlob(blobUrl: string): void {
  clientBlobFiles.delete(blobUrl);
}

/** Upload preview blob in background; keeps File registered until https URL is applied. */
export function scheduleClientMediaPublicUpload(
  blobUrl: string,
  file: File,
  apply: (https: string) => void,
  onError?: (message: string) => void
): void {
  registerClientMediaBlob(blobUrl, file);
  void uploadFileToPublicStorage(file)
    .then((https) => {
      clearClientMediaBlob(blobUrl);
      if (blobUrl.startsWith("blob:")) URL.revokeObjectURL(blobUrl);
      apply(https);
    })
    .catch((e) => {
      onError?.(humanizeClientFetchError(e));
    });
}

/**
 * Ensures a public https URL Atlas can fetch.
 * Uses the original File when available (avoids expired blob: URLs).
 */
export async function resolvePublicHttpsMediaUrl(
  url: string | null,
  file?: File | null
): Promise<string | null> {
  if (!url) return null;
  let t = url.trim();
  if (!t) return null;

  if (t.startsWith("/")) {
    if (typeof window === "undefined") return null;
    t = `${window.location.origin}${t}`;
  }

  const coerced = coerceToPublicHttpsUrl(t);
  if (coerced && atlasCanFetchUrlDirectly(coerced)) return coerced;

  const pendingFile = file ?? clientBlobFiles.get(t) ?? null;
  if (pendingFile) {
    try {
      const https = await uploadFileToPublicStorage(pendingFile);
      clearClientMediaBlob(t);
      if (t.startsWith("blob:")) URL.revokeObjectURL(t);
      return https;
    } catch (e) {
      throw new Error(humanizeClientFetchError(e));
    }
  }

  const needsUpload =
    t.startsWith("blob:") ||
    t.startsWith("data:") ||
    Boolean(coerced && !atlasCanFetchUrlDirectly(coerced));
  if (!needsUpload) return null;

  const fetchSrc = t.startsWith("blob:") || t.startsWith("data:") ? t : coerced ?? t;
  return uploadBlobUrlToPublicStorage(fetchSrc);
}

/**
 * Ensures a public https URL Atlas can fetch.
 * Uploads blob/data URLs and localhost paths via `/api/upload`.
 */
export async function ensurePublicHttpsMediaUrl(url: string | null): Promise<string | null> {
  return resolvePublicHttpsMediaUrl(url);
}
