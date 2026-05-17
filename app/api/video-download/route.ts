import { NextResponse } from "next/server";

import { isAllowedVideoPlaybackHost } from "@/lib/video-playback-proxy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 120;

/**
 * Full-file download proxy (no Range). Use for Save/Download — avoids corrupt MP4s
 * when saving a partial segment from `/api/video-playback`.
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

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "video/mp4";
  const outHeaders = new Headers({
    "Content-Type": contentType,
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
