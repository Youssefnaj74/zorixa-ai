/**
 * Atlas `generateVideo` / prediction poll payloads vary: `outputs` may be string[]
 * or objects with `url` / `uri` / etc. Shared extraction for API routes and UI fallback.
 */
export type AtlasLikeVideoPayload = {
  outputs?: unknown[];
  output?: unknown;
  video?: unknown;
  video_url?: unknown;
  videoUrl?: unknown;
  result?: unknown;
};

function pickNonEmptyString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function urlFromRecord(rec: Record<string, unknown>): string | null {
  return pickNonEmptyString(
    rec.url,
    rec.uri,
    rec.href,
    rec.path,
    rec.video_url,
    rec.videoUrl,
    rec.signed_url,
    rec.signedUrl,
    rec.output_url,
    rec.outputUrl,
    rec.file_url,
    rec.fileUrl,
    rec.download_url,
    rec.downloadUrl
  );
}

function extractFromOutputField(single: unknown): string | null {
  if (typeof single === "string" && single.trim().length > 0) return single.trim();
  if (Array.isArray(single)) {
    for (const item of single) {
      if (typeof item === "string" && item.trim().length > 0) return item.trim();
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const u = urlFromRecord(item as Record<string, unknown>);
        if (u) return u;
      }
    }
    return null;
  }
  if (single && typeof single === "object" && !Array.isArray(single)) {
    return urlFromRecord(single as Record<string, unknown>);
  }
  return null;
}

export function extractAtlasVideoOutputUrl(data: AtlasLikeVideoPayload | undefined): string | null {
  if (!data) return null;

  const outs = data.outputs;
  if (Array.isArray(outs)) {
    for (const item of outs) {
      if (typeof item === "string" && item.trim().length > 0) return item.trim();
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const u = urlFromRecord(item as Record<string, unknown>);
        if (u) return u;
      }
    }
  }

  const fromOutput = extractFromOutputField(data.output);
  if (fromOutput) return fromOutput;

  const d = data as Record<string, unknown>;
  return pickNonEmptyString(
    data.video_url,
    data.videoUrl,
    d.video,
    d.result,
    d.url,
    d.download_url,
    d.downloadUrl
  );
}
