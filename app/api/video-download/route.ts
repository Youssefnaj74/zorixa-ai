import { NextResponse } from "next/server";

import { isAllowedVideoPlaybackHost } from "@/lib/video-playback-proxy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 120;

/**
 * Authenticated download helper for Atlas / Supabase CDN videos.
 *
 * Default (`mode` omitted): **302 redirect** to the public CDN URL — browser downloads
 * directly from Atlas/OSS (no Vercel body timeout, no corrupt partial streams).
 *
 * `?mode=proxy`: buffer full file on server (fallback if CDN blocks browser download).
 */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const target = searchParams.get("url")?.trim();
  if (!target) {
    return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  let remote: URL;
  try {
    remote = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (remote.protocol !== "https:") {
    return NextResponse.json({ error: "Only https URLs are allowed" }, { status: 400 });
  }

  if (!isAllowedVideoPlaybackHost(remote.hostname)) {
    return NextResponse.json({ error: "Video host not allowed" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = searchParams.get("mode")?.trim().toLowerCase();
  if (mode !== "proxy") {
    return NextResponse.redirect(remote.toString(), 302);
  }

  let upstream: Response;
  try {
    upstream = await fetch(remote.toString(), {
      method: "GET",
      headers: {
        Accept: "video/*,*/*;q=0.8",
        "User-Agent": "ZorixaVideoDownload/1.0"
      },
      redirect: "follow",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach video host" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await upstream.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read video from CDN" }, { status: 502 });
  }

  if (bytes.byteLength < 2048) {
    return NextResponse.json({ error: "Video file from CDN is too small or empty" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "video/mp4";
  const outHeaders = new Headers({
    "Content-Type": contentType.includes("video") ? contentType : "video/mp4",
    "Content-Disposition": 'attachment; filename="zorixa-video.mp4"',
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": "private, no-store"
  });

  return new NextResponse(bytes, {
    status: 200,
    headers: outHeaders
  });
}
