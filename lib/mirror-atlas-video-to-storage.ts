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

export function scheduleMirrorAtlasVideoOutput(input: {
  userId: string;
  generationId: number;
  atlasUrl: string;
}): void {
  void mirrorAtlasVideoToSupabaseStorage(input).then(async (mirrored) => {
    if (!mirrored || mirrored === input.atlasUrl) return;
    await supabaseAdmin
      .from("generations")
      .update({ output_url: mirrored })
      .eq("id", input.generationId)
      .eq("user_id", input.userId);
  });
}
