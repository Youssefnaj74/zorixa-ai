import { NextResponse } from "next/server";

import {
  atlasCdnUpstreamFetchHeaders,
  isAllowedVideoPlaybackHost
} from "@/lib/video-playback-proxy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Proxying multi‑MB clips from OSS (Vercel serverless limit). */
export const maxDuration = 120;
export const runtime = "nodejs";

/**
 * Authenticated download — **always proxies** bytes (never 302 to OSS).
 *
 * Browser → zorixaai.com/api/video-download → server fetch OSS (no zorixa Referer) → MP4 attachment.
 * A 302 to atlas-media.aliyuncs.com triggers AccessDenied (bucket referer policy).
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

  let upstream: Response;
  try {
    upstream = await fetch(remote.toString(), {
      method: "GET",
      headers: atlasCdnUpstreamFetchHeaders("download"),
      redirect: "follow",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach video host" }, { status: 502 });
  }

  if (!upstream.ok) {
    const ct = (upstream.headers.get("content-type") ?? "").toLowerCase();
    if (ct.includes("xml")) {
      return NextResponse.json(
        {
          error:
            "Video host denied the download (OSS referer policy). Use the Download button while logged in — do not open the Atlas link directly."
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  const mode = searchParams.get("mode")?.trim().toLowerCase();
  if (mode === "buffer") {
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
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("video") ? contentType : "video/mp4",
        "Content-Disposition": 'attachment; filename="zorixa-video.mp4"',
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store"
      }
    });
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "Empty upstream body" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "video/mp4";
  const outHeaders = new Headers({
    "Content-Type": contentType.includes("video") ? contentType : "video/mp4",
    "Content-Disposition": 'attachment; filename="zorixa-video.mp4"',
    "Cache-Control": "private, no-store"
  });
  const len = upstream.headers.get("content-length");
  if (len) outHeaders.set("Content-Length", len);

  return new NextResponse(upstream.body, {
    status: 200,
    headers: outHeaders
  });
}
