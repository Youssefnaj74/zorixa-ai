import { coerceToPublicHttpsUrl } from "@/lib/coerce-public-https-url";
import {
  atlasCdnUpstreamFetchHeaders,
  isAllowedVideoPlaybackHost
} from "@/lib/video-playback-proxy";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Copy Atlas CDN output into Supabase `uploads` so dashboard history survives link expiry. */
export async function mirrorAtlasVideoToSupabaseStorage(input: {
  userId: string;
  generationId: number;
  atlasUrl: string;
}): Promise<string | null> {
  const source = coerceToPublicHttpsUrl(input.atlasUrl.trim());
  if (!source) return null;

  let host: string;
  try {
    host = new URL(source).hostname;
  } catch {
    return null;
  }
  if (!isAllowedVideoPlaybackHost(host)) return null;

  let upstream: Response;
  try {
    upstream = await fetch(source, {
      headers: atlasCdnUpstreamFetchHeaders("download"),
      redirect: "follow",
      cache: "no-store"
    });
  } catch {
    return null;
  }

  if (!upstream.ok) return null;

  const contentType = (upstream.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("xml") || contentType.includes("json")) return null;

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await upstream.arrayBuffer());
  } catch {
    return null;
  }

  if (bytes.byteLength < 2048) return null;

  const path = `${input.userId}/generations/${input.generationId}.mp4`;
  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(path, bytes, {
    contentType: contentType.includes("video") ? contentType : "video/mp4",
    upsert: true
  });
  if (uploadErr) return null;

  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  return coerceToPublicHttpsUrl(data.publicUrl);
}

/** Mirror after the browser has played the signed URL — avoids single-use CDN race. */
export async function mirrorAtlasVideoAfterPlaybackConfirmed(input: {
  userId: string;
  generationId: number;
}): Promise<boolean> {
  const { data: row, error: fetchErr } = await supabaseAdmin
    .from("generations")
    .select("id, output_url")
    .eq("id", input.generationId)
    .eq("user_id", input.userId)
    .eq("feature_type", "video")
    .maybeSingle();

  if (fetchErr || !row?.output_url) return false;

  const atlasUrl = coerceToPublicHttpsUrl(String(row.output_url).trim());
  if (!atlasUrl) return false;

  let host: string;
  try {
    host = new URL(atlasUrl).hostname;
  } catch {
    return false;
  }
  if (!isAllowedVideoPlaybackHost(host)) return false;
  if (host.endsWith(".supabase.co") || host.endsWith(".supabase.in")) return true;

  const mirrored = await mirrorAtlasVideoToSupabaseStorage({
    userId: input.userId,
    generationId: input.generationId,
    atlasUrl
  });
  if (!mirrored || mirrored === atlasUrl) return false;

  const { error: updateErr } = await supabaseAdmin
    .from("generations")
    .update({ output_url: mirrored })
    .eq("id", input.generationId)
    .eq("user_id", input.userId);

  return !updateErr;
}
