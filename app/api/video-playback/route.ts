import { NextResponse } from "next/server";

import { isAllowedVideoPlaybackHost } from "@/lib/video-playback-proxy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Longer runs when proxying multi‑MB clips from OSS (Vercel / Node). */
export const maxDuration = 120;

const UPSTREAM_HEADERS_TO_CLIENT = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified"
] as const;

/**
 * Authenticated **streaming** proxy to an allowlisted HTTPS video URL.
 *
 * A plain **302 redirect** often breaks `<video src>` (no source / wrong type) because
 * media subresource handling differs from navigation; streaming bytes with correct
 * `Content-Type` (and optional `Range`) is reliable for Atlas / Aliyun OSS outputs.
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")?.trim();
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

  const range = request.headers.get("range");
  const upstreamReqHeaders = new Headers({
    Accept: "video/*,*/*;q=0.8",
    "User-Agent": "ZorixaVideoPlayback/1.0"
  });
  if (range) upstreamReqHeaders.set("Range", range);

  let upstream: Response;
  try {
    upstream = await fetch(remote.toString(), {
      method: "GET",
      headers: upstreamReqHeaders,
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

  if (!upstream.body) {
    return NextResponse.json({ error: "Empty upstream body" }, { status: 502 });
  }

  const outHeaders = new Headers();
  for (const h of UPSTREAM_HEADERS_TO_CLIENT) {
    const v = upstream.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  if (!outHeaders.has("content-type")) {
    outHeaders.set("Content-Type", "video/mp4");
  }
  outHeaders.set("Cache-Control", "private, no-store");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders
  });
}
