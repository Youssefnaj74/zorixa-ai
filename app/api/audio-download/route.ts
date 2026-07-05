import { NextResponse } from "next/server";

import { isAllowedAudioPlaybackHost } from "@/lib/audio-playback-proxy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const runtime = "nodejs";

/** Authenticated download — proxies bytes with Content-Disposition attachment. */
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

  if (!isAllowedAudioPlaybackHost(remote.hostname)) {
    return NextResponse.json({ error: "Audio host not allowed" }, { status: 403 });
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
        Accept: "audio/*,*/*;q=0.8",
        "User-Agent": "ZorixaAudioDownload/1.0"
      },
      redirect: "follow",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach audio host" }, { status: 502 });
  }

  if (!upstream.ok) {
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
      return NextResponse.json({ error: "Failed to read audio from storage" }, { status: 502 });
    }

    if (bytes.byteLength < 256) {
      return NextResponse.json({ error: "Audio file from storage is too small or empty" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("audio") ? contentType : "audio/mpeg",
        "Content-Disposition": 'attachment; filename="zorixa-speech.mp3"',
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store"
      }
    });
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "Empty upstream body" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
  const outHeaders = new Headers({
    "Content-Type": contentType.includes("audio") ? contentType : "audio/mpeg",
    "Content-Disposition": 'attachment; filename="zorixa-speech.mp3"',
    "Cache-Control": "private, no-store"
  });
  const len = upstream.headers.get("content-length");
  if (len) outHeaders.set("Content-Length", len);

  return new NextResponse(upstream.body, {
    status: 200,
    headers: outHeaders
  });
}
