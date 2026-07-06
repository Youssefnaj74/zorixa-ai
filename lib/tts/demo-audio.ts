function normalizeHex(value: string): string {
  return value.trim().replace(/^0x/i, "").replace(/\s+/g, "");
}

export function isHttpAudioUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function isHexAudioPayload(value: string): boolean {
  const normalized = normalizeHex(value);
  if (!normalized || normalized.length % 2 !== 0) return false;
  if (isHttpAudioUrl(normalized)) return false;
  return /^[0-9a-fA-F]+$/.test(normalized);
}

/** Load MiniMax demo audio from a CDN URL or hex payload. */
export async function loadDemoAudioBytes(
  source: string
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const trimmed = source.trim();
  if (!trimmed) {
    throw new Error("Demo audio is missing");
  }

  if (isHttpAudioUrl(trimmed)) {
    const res = await fetch(trimmed, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Demo audio unavailable");
    }
    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "audio/mpeg";
    return { bytes: new Uint8Array(await res.arrayBuffer()), contentType };
  }

  if (isHexAudioPayload(trimmed)) {
    const bytes = Buffer.from(normalizeHex(trimmed), "hex");
    return {
      bytes: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      contentType: "audio/mpeg"
    };
  }

  throw new Error("Unsupported demo audio format");
}
